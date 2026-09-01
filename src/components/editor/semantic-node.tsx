import { Handle, NodeResizer, Position, type Node, type NodeProps } from "@xyflow/react";
import { catalogByType, categoryMeta } from "@/lib/domain/catalog";
import type { ArchitectureNode } from "@/lib/domain/schema";
import styles from "./editor.module.css";

export type SemanticFlowNode = Node<{ component: ArchitectureNode; onResize?: (width: number, height: number) => void }, "semantic">;

export function SemanticNode({ data, selected }: NodeProps<SemanticFlowNode>) {
  const component = data.component;
  const category = categoryMeta[component.category];
  const item = catalogByType.get(component.semanticType);
  return <div className={`${styles.semanticNode} ${selected ? styles.nodeSelected : ""}`} style={{ "--category": category.color } as React.CSSProperties}>
    <NodeResizer isVisible={selected} minWidth={120} minHeight={72} maxWidth={640} maxHeight={480} color="var(--accent)" onResizeEnd={(_, size) => data.onResize?.(size.width, size.height)} />
    <Handle type="target" position={Position.Left} id="in" className={styles.handle} />
    <div className={styles.nodeHeader}><span className={styles.nodeCode}>{item?.shortCode ?? "BR"}</span><span>{category.label}</span></div>
    <div className={styles.nodeName}>{component.name}</div>
    <div className={styles.nodeDetail}>{component.technology || component.provider || item?.description}</div>
    <Handle type="source" position={Position.Right} id="out" className={styles.handle} />
  </div>;
}
