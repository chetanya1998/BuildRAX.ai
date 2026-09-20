import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { buildInputTraceability } from "@/lib/intelligence/input";
import type { RecoveryRecord } from "@/lib/storage/drafts";
import { useCloudSave } from "./use-cloud-save";

vi.mock("@/lib/storage/drafts", async (original) => ({
  ...await original<typeof import("@/lib/storage/drafts")>(),
  loadQueuedProjectSave: vi.fn().mockResolvedValue(undefined),
  queueProjectSave: vi.fn().mockResolvedValue(undefined),
  clearQueuedProjectSave: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/storage/private-assets", () => ({ persistPrivatePresentationImages: vi.fn(async (_scope, presentation) => presentation) }));

function fixture() {
  const diagram = createDiagram("Cloud fixture");
  const ir = architectureIRFromDiagram(diagram);
  const recovery: RecoveryRecord = {
    schemaVersion: 1, key: "account-key", scope: { kind: "account", userId: "user", workspaceId: "workspace" }, revision: 3,
    diagram, architecture: { ir, presentation: presentationFromDiagram(diagram), irVersion: 2 }, document: "", updatedAt: diagram.updatedAt,
  };
  return { diagram, ir, recovery };
}

function responseFor(diagram: ReturnType<typeof createDiagram>, version: number, irVersion: number) {
  const ir = architectureIRFromDiagram(diagram);
  return new Response(JSON.stringify({ saved: [{ version, ir_version: irVersion }], snapshot: { irVersion, ir, materializedDiagram: { ...diagram, version } } }), { status: 200, headers: { "content-type": "application/json" } });
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ shouldAdvanceTime: true }); });

describe("authenticated cloud save hook", () => {
  it("keeps a newer edit pending while the older HTTP response is delayed", async () => {
    const base = fixture();
    const traceability = buildInputTraceability({ prompt: "Build a durable cloud service." });
    let finishFirst!: (response: Response) => void;
    const first = new Promise<Response>((resolve) => { finishFirst = resolve; });
    const fetchMock = vi.fn().mockImplementationOnce(() => first).mockImplementationOnce(async () => responseFor(base.diagram, 12, 4));
    vi.stubGlobal("fetch", fetchMock);
    const applied = vi.fn();
    const { result, rerender } = renderHook(({ diagram }) => useCloudSave({
      enabled: true, diagram, recovery: base.recovery, recoveredUnsynced: false,
      getIR: () => base.ir, getIrVersion: () => 2, applySuccess: applied,
      getTraceability: () => traceability,
    }), { initialProps: { diagram: base.diagram }, wrapper: ({ children }) => <>{children}</> });
    await waitFor(() => expect(result.current.state).toBe("saved"));
    const oldEdit = { ...base.diagram, title: "Old edit" };
    rerender({ diagram: oldEdit });
    await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const latest = { ...base.diagram, title: "Latest edit" };
    rerender({ diagram: latest });
    finishFirst(responseFor(oldEdit, 11, 3));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody.baseVersion).toBe(11);
    expect(secondBody.ir.intent.title).toBe("Latest edit");
    expect(secondBody.traceability).toEqual(traceability);
    await waitFor(() => expect(result.current.state).toBe("saved"));
    expect(applied).toHaveBeenCalledTimes(2);
  });
});
