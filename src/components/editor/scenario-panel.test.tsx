import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createConnector, createDiagram, createNode } from "@/lib/domain/factory";
import { architectureIRFromDiagram } from "@/lib/architecture-ir/snapshot";
import { scenarioFromPath } from "@/lib/architecture-ir/scenarios";
import { buildArchitectureIR, compileArchitectureIR } from "@/lib/architecture-ir/compiler";
import { ScenarioPanel } from "./scenario-panel";

const flow = vi.hoisted(() => ({ getViewport: () => ({ x: 12, y: 34, zoom: .7 }), setViewport: vi.fn().mockResolvedValue(true), fitView: vi.fn().mockResolvedValue(true) }));
vi.mock("@xyflow/react", () => ({ useReactFlow: () => flow, Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, ViewportPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

function props() {
  const diagram = createDiagram("Journey", ["a", "b", "c"].map((id) => createNode("backend-service", id, id, 0, 0)), [createConnector("ab", "a", "b", "http-rest", "Request"), createConnector("bc", "b", "c", "http-rest", "Response")]);
  const ir = architectureIRFromDiagram(diagram);
  ir.scenarios = [scenarioFromPath(ir, { componentIds: ["a", "b", "c"], flowIds: ["ab", "bc"] }, { id: "journey", name: "A to C", patternId: "microservices" })];
  return { ir, diagram, readOnly: false, onSave: vi.fn(), onClose: vi.fn(), onFrame: vi.fn(), previewRef: { current: false } };
}

describe("G03 editor playback", () => {
  it("plays, pauses, steps, restarts and exits without saving or mutating", async () => {
    const input = props(); const before = structuredClone(input.ir);
    render(<ScenarioPanel {...input} />);
    fireEvent.click(screen.getByText("Play scenario"));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("playing · Step 1 of 2");
    fireEvent.click(screen.getByText("Pause scenario"));
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("paused · Step 1 of 2");
    fireEvent.click(screen.getByText("Next step"));
    expect(input.onFrame).toHaveBeenLastCalledWith(expect.objectContaining({ focus: { componentIds: ["b", "c"], flowIds: ["bc"] } }));
    fireEvent.click(screen.getByText("Previous step"));
    fireEvent.click(screen.getByText("Restart scenario"));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("paused · Step 1 of 2");
    fireEvent.click(screen.getByText("Exit playback"));
    await act(async () => {});
    expect(flow.setViewport).toHaveBeenLastCalledWith({ x: 12, y: 34, zoom: .7 }, { duration: 0 });
    expect(input.previewRef.current).toBe(false);
    expect(input.onFrame).toHaveBeenLastCalledWith(null);
    expect(input.onSave).not.toHaveBeenCalled();
    expect(input.ir).toEqual(before);
  });
  it("ticks one ordered step at a time and stops at completion", () => {
    render(<ScenarioPanel {...props()} />);
    fireEvent.click(screen.getByText("Play scenario"));
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("playing · Step 2 of 2");
    act(() => vi.advanceTimersByTime(1200));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("completed · Step 2 of 2");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects stale flows, cancels active playback and retains the saved definition", () => {
    const input = props(); const { rerender } = render(<ScenarioPanel {...input} />);
    fireEvent.click(screen.getByText("Play scenario"));
    const changed = { ...input.ir, flows: input.ir.flows.slice(1) };
    rerender(<ScenarioPanel {...input} ir={changed} />);
    expect(screen.getByRole("alert")).toHaveTextContent("missing-flow");
    expect(screen.getByText("Play scenario")).toBeDisabled();
    expect(document.querySelectorAll("[data-scenario-pulse]")).toHaveLength(0);
    act(() => vi.advanceTimersByTime(30));
    expect(input.onFrame).toHaveBeenLastCalledWith(null);
    expect(changed.scenarios).toHaveLength(1);
  });
  it("supports read-only playback and reduced motion without authoring", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const input = props(); render(<ScenarioPanel {...input} readOnly />);
    expect(screen.queryByText(/Save suggested/)).toBeNull();
    fireEvent.click(screen.getByText("Play scenario"));
    expect(input.onFrame).toHaveBeenLastCalledWith(expect.objectContaining({ pulse: expect.objectContaining({ iterations: 0 }) }));
    expect(document.querySelectorAll('[data-scenario-pulse="0"]')).toHaveLength(2);
    expect(input.onSave).not.toHaveBeenCalled();
  });
  it("clears playback when switching scenarios or receiving a revised definition", () => {
    const input = props();
    input.ir.scenarios!.push({ ...structuredClone(input.ir.scenarios![0]), id: "second", name: "Second journey" });
    const { rerender } = render(<ScenarioPanel {...input} />);
    fireEvent.click(screen.getByText("Play scenario"));
    fireEvent.change(screen.getByLabelText("Scenario", { exact: true }), { target: { value: "second" } });
    expect(input.onFrame).toHaveBeenLastCalledWith(null);
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByText("Play scenario"));
    const revised = { ...input.ir, scenarios: input.ir.scenarios!.map((item) => ({ ...item, revision: 2 })) };
    rerender(<ScenarioPanel {...input} ir={revised} />);
    act(() => vi.advanceTimersByTime(30));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("idle");
    expect(input.onFrame).toHaveBeenLastCalledWith(null);
  });
  it("pauses on backgrounding and cancels timers on Escape and unmount", async () => {
    const input = props(); const { unmount } = render(<ScenarioPanel {...input} />);
    fireEvent.click(screen.getByText("Play scenario"));
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.getByTestId("scenario-status")).toHaveTextContent("paused");
    visibility.mockRestore();
    fireEvent.keyDown(window, { key: "Escape" });
    await act(async () => {});
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByText("Play scenario"));
    unmount();
    await act(async () => {});
    expect(vi.getTimerCount()).toBe(0);
    expect(input.previewRef.current).toBe(false);
    expect(flow.setViewport).toHaveBeenCalledTimes(2);
  });
  it("saves pattern proposals only after an explicit authoring action", () => {
    const input = props(); const ir = buildArchitectureIR({ prompt: "A SaaS application", templateId: "multi-tenant-saas" });
    render(<ScenarioPanel {...input} ir={ir} diagram={compileArchitectureIR(ir)} />);
    expect(input.onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Save suggested scenarios/ }));
    expect(input.onSave).toHaveBeenCalledTimes(1);
  });
});
