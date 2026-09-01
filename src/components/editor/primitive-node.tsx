import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import type { Diagram } from "@/lib/domain/schema";
import styles from "./editor.module.css";

type Primitive = Diagram["primitives"][number];
export type PrimitiveFlowNode = Node<{
  primitive: Primitive;
  onResize?: (width: number, height: number) => void;
  onTextChange?: (text: string) => void;
}, "primitive">;

export function PrimitiveNode({ data, selected }: NodeProps<PrimitiveFlowNode>) {
  const item = data.primitive;
  return <div className={`${styles.primitive} ${styles[`primitive_${item.kind}`]} ${selected ? styles.primitiveSelected : ""}`}>
    <NodeResizer isVisible={selected && !["line", "arrow", "freehand"].includes(item.kind)} minWidth={40} minHeight={28} color="var(--accent)" onResizeEnd={(_, size) => data.onResize?.(size.width, size.height)} />
    {item.kind === "freehand" ? <span className={styles.scribble}>≈</span> : item.kind === "text" ? <textarea className={`${styles.primitiveTextInput} nodrag nopan`} value={item.text} placeholder="Type here…" aria-label="Text label" onChange={(event) => data.onTextChange?.(event.target.value)} onMouseDown={(event) => event.stopPropagation()} /> : <span>{item.text}</span>}
  </div>;
}
