import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import type { Diagram } from "@/lib/domain/schema";
import styles from "./editor.module.css";

type Primitive = Diagram["primitives"][number];
export type PrimitiveFlowNode = Node<{
  primitive: Primitive;
  onResize?: (width: number, height: number) => void;
  onTextEditStart?: () => void;
  onTextChange?: (text: string) => void;
  onTextEditEnd?: () => void;
}, "primitive">;

export function PrimitiveNode({ data, selected }: NodeProps<PrimitiveFlowNode>) {
  const item = data.primitive;
  const points = item.kind === "freehand" ? (() => {
    try {
      const parsed = JSON.parse(item.style.points ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((point): point is { x: number; y: number } => typeof point?.x === "number" && typeof point?.y === "number") : [];
    } catch { return []; }
  })() : [];
  return <div className={`${styles.primitive} ${styles[`primitive_${item.kind}`]} ${selected ? styles.primitiveSelected : ""}`}>
    <NodeResizer isVisible={selected && !["freehand"].includes(item.kind)} minWidth={item.kind === "line" || item.kind === "arrow" ? 80 : 40} minHeight={item.kind === "line" || item.kind === "arrow" ? 20 : 28} color="var(--accent)" onResizeEnd={(_, size) => data.onResize?.(size.width, size.height)} />
    {item.kind === "freehand" ? <svg className={styles.freehandSvg} viewBox={`0 0 ${item.dimensions.width} ${item.dimensions.height}`} aria-label="Freehand drawing"><polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} /></svg> : item.kind === "text" ? <textarea autoFocus={selected && !item.text} className={`${styles.primitiveTextInput} nodrag nopan`} value={item.text} placeholder="Type here…" aria-label="Text label" onFocus={data.onTextEditStart} onChange={(event) => data.onTextChange?.(event.target.value)} onBlur={data.onTextEditEnd} onMouseDown={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()} /> : <span>{item.text}</span>}
  </div>;
}
