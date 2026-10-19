import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDiagram, createNode } from "@/lib/domain/factory";
import { architectureIRFromDiagram } from "@/lib/architecture-ir/snapshot";
import type { PresentationObject } from "@/lib/architecture-ir/presentation-objects";
import { PresentationTools } from "./presentation-tools";
import { movePresentationGroup, objectBounds } from "./presentation-geometry";

const flow = vi.hoisted(() => ({ getViewport: () => ({ x: 10, y: 20, zoom: 1 }), setViewport: vi.fn().mockResolvedValue(true), fitBounds: vi.fn().mockResolvedValue(true) }));
vi.mock("@xyflow/react", () => ({ useReactFlow: () => flow, Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, ViewportPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const base = { schemaVersion: "1.0.0" as const, id: "visual", revision: 1, zIndex: 1 };
const focus: PresentationObject = { ...base, kind: "focus", name: "Service", targets: [{ kind: "component", id: "a" }], viewport: { x: 50, y: 60, zoom: 1.5 } };
function fixture() { return createDiagram("Visual", [createNode("backend-service", "a", "Service", 0, 0), createNode("backend-service", "b", "Other", 400, 0)]); }

describe("P01 editor integration", () => {
  it("routes creation through the supplied common commit without changing semantic IR", () => {
    let diagram = fixture(); const ir = architectureIRFromDiagram(diagram);
    const commit = vi.fn((transform) => { diagram = transform(diagram); });
    render(<PresentationTools diagram={diagram} readOnly={false} selectedIds={[]} commit={commit} previewRef={{ current: false }} />);
    fireEvent.click(screen.getByText("Presentation objects"));
    fireEvent.change(screen.getByLabelText("Object text"), { target: { value: "Review data retention" } });
    fireEvent.click(screen.getByText("Create object"));
    expect(commit).toHaveBeenCalledTimes(1);
    expect(diagram.presentationObjects?.[0]).toMatchObject({ kind: "note", text: "Review data retention" });
    expect(architectureIRFromDiagram(diagram, ir)).toEqual(ir);
  });
  it("renders read-only objects and restores transient focus without committing", async () => {
    const diagram = fixture(); diagram.presentationObjects = [focus];
    const commit = vi.fn(); const previewRef = { current: false };
    render(<PresentationTools diagram={diagram} readOnly selectedIds={[]} commit={commit} previewRef={previewRef} />);
    fireEvent.click(screen.getByText("Presentation objects"));
    fireEvent.change(screen.getByLabelText("Saved object"), { target: { value: "visual" } });
    expect(screen.queryByText("Create object")).toBeNull();
    expect(screen.queryByText("Delete object")).toBeNull();
    fireEvent.click(screen.getByText("Open saved focus"));
    expect(previewRef.current).toBe(true);
    expect(flow.setViewport).toHaveBeenCalledWith(focus.viewport, { duration: 0 });
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(previewRef.current).toBe(false));
    expect(flow.setViewport).toHaveBeenLastCalledWith({ x: 10, y: 20, zoom: 1 }, { duration: 0 });
    expect(commit).not.toHaveBeenCalled();
  });
  it("warns for orphan anchors and supports explicit repair", () => {
    let diagram = fixture(); diagram.presentationObjects = [{ ...base, kind: "annotation", text: "Keep me", anchor: { kind: "component", id: "deleted" }, offset: { x: 0, y: 0 } }];
    render(<PresentationTools diagram={diagram} readOnly={false} selectedIds={[]} commit={(transform) => { diagram = transform(diagram); }} previewRef={{ current: false }} />);
    fireEvent.click(screen.getByText("Presentation objects"));
    fireEvent.change(screen.getByLabelText("Saved object"), { target: { value: "visual" } });
    expect(screen.getByRole("status").textContent).toContain("preserved");
    fireEvent.click(screen.getByLabelText("component: Service"));
    fireEvent.click(screen.getByText("Save object"));
    expect(diagram.presentationObjects[0]).toMatchObject({ revision: 2, anchor: { id: "a" }, text: "Keep me" });
  });
  it("moves flat group members as a visual-only immutable transaction", () => {
    const diagram = fixture(); const before = structuredClone(diagram); const ir = architectureIRFromDiagram(diagram);
    const group: PresentationObject = { ...base, kind: "group", name: "Boundary", members: [{ kind: "component", id: "a" }] };
    const moved = movePresentationGroup(diagram, group, 20, -20);
    expect(moved.nodes[0].position).toEqual({ x: 20, y: -20 });
    expect(moved.nodes[0].metadata.manualPosition).toBe(true);
    expect(moved.nodes[1]).toEqual(diagram.nodes[1]);
    expect(diagram).toEqual(before);
    expect(architectureIRFromDiagram(moved, ir)).toEqual(ir);
    expect(objectBounds(moved, group)).toEqual({ x: 20, y: -20, width: 220, height: 112 });
  });
});
