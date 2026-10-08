"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { ViewportPortal } from "@xyflow/react";
import type { CanvasPoint } from "./canvas-interaction";
import { FreehandBuffer, smoothFreehandPath } from "./freehand-buffer";

export type FreehandPreviewHandle = {
  begin: (point: CanvasPoint) => void;
  append: (point: CanvasPoint) => void;
  finish: (point: CanvasPoint) => CanvasPoint[];
  cancel: () => void;
};

/** Only this SVG path changes while sampling; React Flow's node model is untouched. */
export function FreehandPreview({ active, ref }: { active: boolean; ref: Ref<FreehandPreviewHandle> }) {
  const path = useRef<SVGPathElement>(null);
  const buffer = useRef<FreehandBuffer | null>(null);
  const frame = useRef<number | null>(null);

  useImperativeHandle(ref, () => {
    function cancel() {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      buffer.current = null;
      path.current?.setAttribute("d", "");
    }
    return {
      begin(point) { cancel(); buffer.current = new FreehandBuffer(); buffer.current.append(point); },
      append(point) {
        if (!buffer.current) return;
        buffer.current.append(point);
        if (frame.current === null) frame.current = requestAnimationFrame(() => {
          frame.current = null;
          path.current?.setAttribute("d", smoothFreehandPath(buffer.current?.points ?? []));
        });
      },
      finish(point) {
        buffer.current?.append(point, true);
        const points = buffer.current?.points ?? [];
        cancel();
        return points;
      },
      cancel,
    };
  }, []);

  useEffect(() => {
    if (!active) {
      buffer.current = null;
      path.current?.setAttribute("d", "");
    }
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [active]);

  return <ViewportPortal><svg aria-label="Freehand preview" style={{ position: "absolute", left: 0, top: 0, width: 1, height: 1, overflow: "visible", pointerEvents: "none" }}><path ref={path} fill="none" stroke="var(--text, #111827)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg></ViewportPortal>;
}
