import { beforeEach, describe, expect, it, vi } from "vitest";
import { presentationFixture } from "@/test/presentation-fixture";
import { hashShareToken } from "@/lib/server/share-token";
import SharePage from "./page";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ rpc }) }));
vi.mock("@/lib/supabase/architecture-artifacts", () => ({ readArchitectureVersion: vi.fn() }));
vi.mock("@/components/editor/architecture-editor", () => ({ ArchitectureEditor: () => null }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
beforeEach(() => rpc.mockReset());

describe("P01 share page contract", () => {
  it("validates and forwards every presentation kind to the read-only editor without private artifacts", async () => {
    const diagram = presentationFixture();
    rpc.mockResolvedValue({ data: [{ diagram_id: diagram.id, diagram_title: diagram.title, diagram_payload: diagram, evidence_payload: { private: "not for viewers" } }], error: null });
    const page = await SharePage({ params: Promise.resolve({ token: "local-share-token" }) });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("read_shared_diagram", { target_token_hash: hashShareToken("local-share-token") });
    expect(page.props.readOnly).toBe(true);
    expect(page.props.initialDiagram.presentationObjects).toEqual(diagram.presentationObjects);
    expect(page.props.initialDiagram.viewport).toEqual(diagram.viewport);
    expect(Object.keys(page.props).sort()).toEqual(["initialDiagram", "readOnly"]);
    expect(JSON.stringify(page.props)).not.toContain("not for viewers");
  });
  it.each([{ data: [] }, { data: [{ diagram_id: "invalid", diagram_title: "Invalid", diagram_payload: {} }] }])("rejects missing or malformed shared content", async ({ data }) => {
    rpc.mockResolvedValue({ data, error: null });
    await expect(SharePage({ params: Promise.resolve({ token: "invalid" }) })).rejects.toThrow("NOT_FOUND");
  });
});
