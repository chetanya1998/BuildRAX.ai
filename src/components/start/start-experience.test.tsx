import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartExperience } from "./start-experience";
import { saveDraft } from "@/lib/storage/drafts";

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
});
