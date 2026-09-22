import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartExperience } from "./start-experience";
import { saveDraft } from "@/lib/storage/drafts";
import { buildArchitectureIR, compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { presentationFromDiagram } from "@/lib/architecture-ir/snapshot";
import { buildInputTraceability } from "@/lib/intelligence/input";
import { evaluateArchitectureRules, matchArchitecturePatterns } from "@/lib/intelligence/patterns";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/storage/drafts", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/storage/drafts")>(),
  saveDraft: vi.fn(),
}));
vi.mock("@/lib/ui/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/components/ui/theme-toggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

const generationRequest = { prompt: "Build a multi-tenant support platform with queued background jobs." } as const;
const generatedIR = buildArchitectureIR(generationRequest);
const generatedDiagram = compileArchitectureIR(generatedIR);
const generatedTraceability = buildInputTraceability(generationRequest);
const generatedResult = {
  artifact: {
    ir: generatedIR,
    traceability: generatedTraceability,
    presentation: presentationFromDiagram(generatedDiagram),
    diagram: generatedDiagram,
    checksums: { ir: "a".repeat(64), presentation: "b".repeat(64), diagram: "c".repeat(64), evidence: "d".repeat(64), requirements: "e".repeat(64) },
    generationReceipt: { requestId: "33333333-3333-4333-8333-333333333333", irChecksum: "a".repeat(64), diagramChecksum: "c".repeat(64), issuedAt: "2026-09-22T00:00:00.000Z", signature: "A".repeat(43) },
  },
  validation: { valid: true, errors: [], warnings: [] },
  proposals: {
    patterns: matchArchitecturePatterns(generationRequest).map((match) => ({ patternId: match.pattern.id, score: match.score, matchedTerms: match.matchedTerms, explicit: match.explicit, conflicts: match.conflicts })),
    rules: evaluateArchitectureRules({ request: generationRequest, traceability: generatedTraceability }),
  },
  summary: {
    facts: [generationRequest.prompt],
    assumptions: generatedIR.assumptions.map((item) => item.text).slice(0, 8),
    unknowns: generatedTraceability.requirements.items.filter((item) => item.state === "unknown").map((item) => item.question!).slice(0, 8),
  },
  context: { omitted: [], budget: { inputTokens: 16_000, outputTokens: 6_000, instructionTokens: 0, schemaTokens: 0, contentTokens: 0, usedInputTokens: 0, remainingInputTokens: 16_000 } },
  meta: { gatewayVersion: "1.0.0", requestId: "33333333-3333-4333-8333-333333333333", task: "architecture-synthesis", provider: "deterministic", model: "buildrax-compiler-v1", durationMs: 0, attempts: 1, successfulCalls: 0, repairCalls: 0, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 } },
};

function completedJobResponse() {
  return new Response(JSON.stringify({ job: {
    id: "33333333-3333-4333-8333-333333333333",
    status: "completed",
    stage: "published",
    progress: 100,
    attempts: 1,
    result: generatedResult,
    error: null,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:01.000Z",
    completedAt: "2026-09-22T00:00:01.000Z",
  } }), { status: 200, headers: { "content-type": "application/json" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "11111111-1111-4111-8111-111111111111") });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("new architecture journey", () => {
  it("keeps anonymous blank canvases as recoverable browser drafts", async () => {
    render(<StartExperience />);
    fireEvent.click(screen.getByRole("button", { name: /blank canvas/i }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledOnce());
    expect(fetch).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/draft/11111111-1111-4111-8111-111111111111");
  });

  it("creates a workspace project before opening a signed-in blank canvas", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ project: { projectId: "project-one" } }), { status: 201, headers: { "content-type": "application/json" } }));
    render(<StartExperience authenticated />);
    fireEvent.click(screen.getByRole("button", { name: /blank canvas/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/v1/projects", expect.objectContaining({ method: "POST" })));
    expect(saveDraft).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/projects/project-one/canvas");
  });

  it("does not silently downgrade a failed signed-in save to a guest draft", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Workspace unavailable" }), { status: 403, headers: { "content-type": "application/json" } }));
    render(<StartExperience authenticated />);
    fireEvent.click(screen.getByRole("button", { name: /blank canvas/i }));
    expect(await screen.findByText("Workspace unavailable")).toBeVisible();
    expect(saveDraft).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("sends architecture context as separate fields", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ expiresAt: Date.now() + 60_000 }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
      error: "Check the architecture inputs and try again.",
      stage: "input-validation",
      fieldErrors: { scale: ["Unsupported scale."] },
    }), { status: 422, headers: { "content-type": "application/json" } }));
    render(<StartExperience />);
    const description = "Build a tenant-aware support platform and preserve every explicit input.";
    fireEvent.change(screen.getByLabelText("Architecture prompt"), { target: { value: description } });
    fireEvent.change(screen.getByLabelText("Product type"), { target: { value: "Support platform" } });
    fireEvent.change(screen.getByLabelText("Preferred stack"), { target: { value: "Next.js, PostgreSQL" } });
    fireEvent.change(screen.getByLabelText("Cloud provider"), { target: { value: "AWS" } });
    fireEvent.change(screen.getByLabelText("Expected scale"), { target: { value: "large" } });
    fireEvent.change(screen.getByLabelText("Tenancy"), { target: { value: "multi-tenant" } });
    fireEvent.change(screen.getByLabelText("Data sensitivity"), { target: { value: "confidential" } });
    fireEvent.click(screen.getByRole("button", { name: /generate architecture/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(vi.mocked(fetch).mock.calls[0]).toEqual(["/api/v1/guest-session", { method: "POST" }]);
    const [, init] = vi.mocked(fetch).mock.calls[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      request: {
        prompt: description,
        productType: "Support platform",
        preferredStack: "Next.js, PostgreSQL",
        cloudProvider: "AWS",
        scale: "large",
        tenancy: "multi-tenant",
        dataSensitivity: "confidential",
      },
      mode: "auto",
    });
    expect(await screen.findByText("Scale: Unsupported scale.")).toBeVisible();
    expect(screen.getByLabelText("Architecture prompt")).toHaveValue(description);
  });

  it("shows a validated first result before the user saves and opens it", async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/v1/guest-session") return new Response(JSON.stringify({ expiresAt: Date.now() + 60_000 }), { status: 201 });
      if (url === "/api/v1/generation-jobs" && init?.method === "POST") return new Response(JSON.stringify({ job: { id: "33333333-3333-4333-8333-333333333333", status: "queued", stage: "accepted", progress: 0 } }), { status: 202 });
      if (url.endsWith("/run")) return new Response(JSON.stringify({ job: { status: "completed" } }), { status: 200 });
      if (url === "/api/v1/generation-jobs/33333333-3333-4333-8333-333333333333") return completedJobResponse();
      throw new Error(`Unexpected request ${url}`);
    });
    render(<StartExperience />);
    fireEvent.change(screen.getByLabelText("Architecture prompt"), { target: { value: generationRequest.prompt } });
    fireEvent.click(screen.getByRole("button", { name: /generate architecture/i }));

    expect(await screen.findByRole("heading", { name: /inspect what buildrax understood/i })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Facts" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Assumptions" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Unknowns" })).toBeVisible();
    expect(saveDraft).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /open validated architecture/i }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ prompt: generationRequest.prompt, status: "ready" })));
    expect(push).toHaveBeenCalledWith(`/draft/${generatedDiagram.id}`);
  });

  it("cancels active work and retries from retained checkpoints", async () => {
    let retried = false;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = String(input);
      if (url === "/api/v1/guest-session") return Promise.resolve(new Response(JSON.stringify({ expiresAt: Date.now() + 60_000 }), { status: 201 }));
      if (url === "/api/v1/generation-jobs" && init?.method === "POST") return Promise.resolve(new Response(JSON.stringify({ job: { id: "33333333-3333-4333-8333-333333333333", status: "queued", stage: "accepted", progress: 0 } }), { status: 202 }));
      if (url.endsWith("/cancel")) return Promise.resolve(new Response(JSON.stringify({ job: { status: "cancelled" } }), { status: 200 }));
      if (url.endsWith("/retry")) { retried = true; return Promise.resolve(new Response(JSON.stringify({ job: { status: "queued" } }), { status: 202 })); }
      if (url.endsWith("/run")) return Promise.resolve(new Response(JSON.stringify({ job: { status: retried ? "completed" : "running" } }), { status: retried ? 200 : 202 }));
      if (url === "/api/v1/generation-jobs/33333333-3333-4333-8333-333333333333") {
        if (retried) return Promise.resolve(completedJobResponse());
        return new Promise((_, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true }));
      }
      return Promise.reject(new Error(`Unexpected request ${url}`));
    });
    render(<StartExperience />);
    fireEvent.change(screen.getByLabelText("Architecture prompt"), { target: { value: generationRequest.prompt } });
    fireEvent.click(screen.getByRole("button", { name: /generate architecture/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(await screen.findByText(/completed stages are retained for retry/i)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /retry generation/i }));
    expect(await screen.findByRole("heading", { name: /inspect what buildrax understood/i })).toBeVisible();
    expect(retried).toBe(true);
  });
});
