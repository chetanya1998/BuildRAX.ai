/* eslint-disable @next/next/no-img-element -- user-selected local data URLs cannot use Next image optimization. */
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import { useEffect, useRef } from "react";
import type { Diagram } from "@/lib/domain/schema";
import styles from "./editor.module.css";
import { privateAssetRenderUrl } from "@/lib/storage/asset-references";

type Primitive = Diagram["primitives"][number];
export type PrimitiveFlowNode = Node<{
  primitive: Primitive;
  onResize?: (width: number, height: number) => void;
  isEditing?: boolean;
  onTextEditActivate?: () => void;
  onTextEditStart?: () => void;
  onTextChange?: (text: string) => void;
  onTextEditEnd?: () => void;
  onTextEditCancel?: () => void;
}, "primitive">;

function smoothFreehandPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index];
    const start = points[index];
    const end = points[index + 1];
    const after = points[index + 2] ?? end;
    const controlOne = { x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 };
    const controlTwo = { x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 };
    path += ` C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`;
  }
  return path;
}

export function PrimitiveNode({ data, selected }: NodeProps<PrimitiveFlowNode>) {
  const item = data.primitive;
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const arrowStyle = item.style.arrowStyle ?? "end";
  const arrowTexture = item.style.arrowTexture ?? "solid";
  const textStyle = {
    fontFamily: item.style.fontFamily === "hand" ? '"Noteworthy", "Bradley Hand", "Segoe Print", "Comic Sans MS", cursive' : item.style.fontFamily === "serif" ? 'Georgia, "Times New Roman", serif' : item.style.fontFamily === "mono" ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : "var(--font)",
    fontSize: `${Math.max(12, Math.min(48, Number(item.style.fontSize ?? 20)))}px`,
    color: item.style.color ?? "var(--text)",
    fontWeight: item.style.fontWeight === "bold" ? 700 : 400,
    fontStyle: item.style.fontStyle === "italic" ? "italic" : "normal",
    textDecoration: item.style.textDecoration === "underline" ? "underline" : "none",
  };
  const points = item.kind === "freehand" ? (() => {
    try {
      const parsed = JSON.parse(item.style.points ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((point): point is { x: number; y: number } => typeof point?.x === "number" && typeof point?.y === "number") : [];
    } catch { return []; }
  })() : [];
  useEffect(() => {
    if (item.kind !== "text" || !data.isEditing) return;
    const frame = window.requestAnimationFrame(() => textInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [data.isEditing, item.kind]);
  return <div className={`${styles.primitive} ${styles[`primitive_${item.kind}`]} ${item.kind === "arrow" && arrowStyle !== "end" ? styles[`primitive_arrow${arrowStyle[0].toUpperCase()}${arrowStyle.slice(1)}`] : ""} ${item.kind === "arrow" && arrowTexture !== "solid" ? styles[`primitive_arrow${arrowTexture[0].toUpperCase()}${arrowTexture.slice(1)}`] : ""} ${selected ? styles.primitiveSelected : ""}`}>
    <NodeResizer isVisible={selected && !["freehand"].includes(item.kind) && !(item.kind === "text" && data.isEditing)} minWidth={item.kind === "line" || item.kind === "arrow" ? 80 : 40} minHeight={item.kind === "line" || item.kind === "arrow" ? 20 : 28} color="var(--accent)" onResizeEnd={(_, size) => data.onResize?.(size.width, size.height)} />
    {item.kind === "freehand" ? <svg className={styles.freehandSvg} viewBox={`0 0 ${item.dimensions.width} ${item.dimensions.height}`} aria-label="Freehand drawing"><path d={smoothFreehandPath(points)} /></svg> : item.kind === "text" ? <textarea ref={textInputRef} readOnly={!data.isEditing} className={`${styles.primitiveTextInput} nodrag nopan ${data.isEditing ? styles.primitiveTextEditing : ""}`} style={textStyle} value={item.text} placeholder="Type here…" aria-label="Text label" onClick={data.onTextEditActivate} onFocus={data.onTextEditStart} onChange={(event) => data.onTextChange?.(event.target.value)} onBlur={data.onTextEditEnd} onMouseDown={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Escape") { event.preventDefault(); data.onTextEditCancel?.(); event.currentTarget.blur(); } if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.blur(); } }} /> : item.kind === "image" ? <img className={styles.primitiveImage} src={privateAssetRenderUrl(item.style.src ?? "")} alt={item.text || "Canvas image"} draggable={false} /> : item.kind === "arrow" && arrowStyle === "both" ? <span className={styles.primitive_arrowBothStart} aria-hidden="true" /> : <span>{item.text}</span>}
  </div>;
}
