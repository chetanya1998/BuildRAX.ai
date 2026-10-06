import { act, cleanup, render, screen } from "@testing-library/react";
import { createRef, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FreehandBuffer, MAX_STROKE_POINTS, smoothFreehandPath } from "./freehand-buffer";
import { FreehandPreview, type FreehandPreviewHandle } from "./freehand-preview";

vi.mock("@xyflow/react", () => ({ ViewportPortal: ({ children }: { children: ReactNode }) => children }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("bounded freehand sampling", () => {
  it("bounds long strokes while retaining both endpoints", () => {
    const buffer = new FreehandBuffer();
    for (let x = 0; x < 100_000; x++) buffer.append({ x, y: Math.sin(x) });
    expect(buffer.points.length).toBeLessThanOrEqual(MAX_STROKE_POINTS);
    expect(buffer.points[0]).toEqual({ x: 0, y: 0 });
    expect(buffer.points.at(-1)?.x).toBe(99_999);
  });
  it("filters jitter and invalid points but includes a subpixel release endpoint", () => {
    const buffer = new FreehandBuffer();
    buffer.append({ x: 0, y: 0 });
    buffer.append({ x: .1, y: 0 });
    buffer.append({ x: NaN, y: 0 });
    expect(buffer.points).toHaveLength(1);
    buffer.append({ x: .2, y: 0 }, true);
    expect(buffer.points).toHaveLength(2);
    expect(smoothFreehandPath(buffer.points)).toContain("L 0.2 0");
  });
  it("batches SVG preview updates without rerendering the editor parent", () => {
    let renders = 0;
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => { frames.push(callback); return frames.length; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const ref = createRef<FreehandPreviewHandle>();
    function Parent() { renders++; return <FreehandPreview ref={ref} active />; }
    render(<Parent />);
    act(() => {
      ref.current!.begin({ x: 0, y: 0 });
      for (let x = 1; x <= 200; x++) ref.current!.append({ x, y: x });
    });
    expect(frames).toHaveLength(1);
    act(() => frames[0](0));
    expect(screen.getByLabelText("Freehand preview").querySelector("path")?.getAttribute("d")).toContain(" C ");
    expect(renders).toBe(1);
    const points = ref.current!.finish({ x: 201, y: 201 });
    expect(points.at(-1)).toEqual({ x: 201, y: 201 });
    expect(screen.getByLabelText("Freehand preview").querySelector("path")).toHaveAttribute("d", "");
  });
  it("discards the draft on cancellation or tool change", () => {
    const ref = createRef<FreehandPreviewHandle>();
    const { rerender } = render(<FreehandPreview ref={ref} active />);
    ref.current!.begin({ x: 0, y: 0 });
    ref.current!.cancel();
    expect(ref.current!.finish({ x: 20, y: 20 })).toEqual([]);
    ref.current!.begin({ x: 0, y: 0 });
    rerender(<FreehandPreview ref={ref} active={false} />);
    expect(ref.current!.finish({ x: 20, y: 20 })).toEqual([]);
  });
});
