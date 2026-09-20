import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartExperience } from "./start-experience";
import { saveDraft } from "@/lib/storage/drafts";
import { createDiagram } from "@/lib/domain/factory";
import { architectureIRFromDiagram, presentationFromDiagram } from "@/lib/architecture-ir/snapshot";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/storage/drafts", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/storage/drafts")>(),
  saveDraft: vi.fn(),
}));
vi.mock("@/lib/ui/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/components/ui/theme-toggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
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
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "signed-guest-token" }), { status: 201, headers: { "content-type": "application/json" } }))
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
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/v1/guest-session");
    const [url, init] = vi.mocked(fetch).mock.calls[1];
    expect(url).toBe("/api/v1/generation-jobs");
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

  it("shows explainable results before committing the generated draft", async () => {
    const diagram = createDiagram("Generated architecture");
    const result = {
      artifact: {
        diagram,
        ir: architectureIRFromDiagram(diagram),
        presentation: presentationFromDiagram(diagram),
      },
      summary: {
        facts: ["The system supports multiple tenants."],
        assumptions: ["Traffic begins at pilot scale."],
        unknowns: ["Which recovery objective is required?"],
      },
    };
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/v1/guest-session") return new Response(JSON.stringify({ token: "signed-guest-token" }), { status: 201 });
      if (url === "/api/v1/generation-jobs") return new Response(JSON.stringify({ job: { id: "44444444-4444-4444-8444-444444444444" } }), { status: 202 });
      if (url.endsWith("/run")) return new Response(JSON.stringify({ job: { status: "running" } }), { status: 202 });
      return new Response(JSON.stringify({ job: { status: "completed", stage: "published", progress: 100, result } }), { status: 200 });
    });
    render(<StartExperience />);
    const description = "Build a multi-tenant support platform with background processing.";
    fireEvent.change(screen.getByLabelText("Architecture prompt"), { target: { value: description } });
    fireEvent.click(screen.getByRole("button", { name: /generate architecture/i }));

    expect(await screen.findByRole("heading", { name: /review what shaped this architecture/i })).toBeVisible();
    expect(screen.getByText("The system supports multiple tenants.")).toBeVisible();
    expect(saveDraft).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /open validated architecture/i }));

    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(expect.objectContaining({ id: diagram.id, prompt: description, status: "ready" })));
    expect(push).toHaveBeenCalledWith(`/draft/${diagram.id}`);
  });
});
