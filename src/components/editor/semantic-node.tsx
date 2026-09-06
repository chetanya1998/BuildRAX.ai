import { Handle, NodeResizer, Position, type Node, type NodeProps } from "@xyflow/react";
import { catalogByType, categoryMeta } from "@/lib/domain/catalog";
import type { ArchitectureNode } from "@/lib/domain/schema";
import { SemanticCatalogIcon } from "./semantic-catalog-icon";
import styles from "./editor.module.css";

export type SemanticFlowNode = Node<{
  component: ArchitectureNode;
  onResize?: (width: number, height: number) => void;
  showConnectors?: boolean;
  isRenaming?: boolean;
  onRenameStart?: () => void;
  onNameChange?: (name: string) => void;
  onRenameEnd?: () => void;
  onRenameCancel?: () => void;
}, "semantic">;

export function SemanticNode({ data, selected }: NodeProps<SemanticFlowNode>) {
  const component = data.component;
  const category = categoryMeta[component.category];
  const item = catalogByType.get(component.semanticType);
  const appearanceVariant = ["card", "tinted", "outline"].includes(String(component.metadata.appearanceVariant)) ? String(component.metadata.appearanceVariant) : "card";
  const accentColor = typeof component.metadata.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(component.metadata.accentColor) ? component.metadata.accentColor : category.color;
  const fillColor = typeof component.metadata.fillColor === "string" && /^#[0-9a-f]{6}$/i.test(component.metadata.fillColor) ? component.metadata.fillColor : "var(--surface)";
  const borderRadius = ["8", "16", "24"].includes(String(component.metadata.borderRadius)) ? String(component.metadata.borderRadius) : "16";
  const shadow = component.metadata.shadow === "none" ? "none" : component.metadata.shadow === "raised" ? "var(--shadow-lg)" : "var(--shadow-sm)";
  return <div className={`${styles.semanticNode} ${selected ? styles.nodeSelected : ""}`} data-variant={appearanceVariant} style={{ "--category": accentColor, "--node-fill": fillColor, "--node-radius": `${borderRadius}px`, "--node-shadow": shadow } as React.CSSProperties}>
    <NodeResizer isVisible={selected} minWidth={120} minHeight={72} maxWidth={640} maxHeight={480} color="var(--accent)" onResizeEnd={(_, size) => data.onResize?.(size.width, size.height)} />
    <Handle type="target" position={Position.Left} id="in" className={`${styles.handle} ${data.showConnectors ? styles.handleVisible : ""}`} title="Connect into this component" aria-label={`Connect into ${component.name}`} />
    <div className={styles.nodeHeader}><span className={styles.nodeCode} title={item?.name ?? component.semanticType}><SemanticCatalogIcon semanticType={component.semanticType} size={14} /></span><span>{category.label}</span></div>
    {data.isRenaming ? <input
      autoFocus
      className={`${styles.nodeNameInput} nodrag nopan`}
      value={component.name}
      aria-label="Component name"
      onFocus={data.onRenameStart}
      onChange={(event) => data.onNameChange?.(event.target.value)}
      onBlur={data.onRenameEnd}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") { event.preventDefault(); data.onRenameCancel?.(); event.currentTarget.blur(); }
        if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
      }}
    /> : <div className={styles.nodeName}>{component.name}</div>}
    <div className={styles.nodeDetail}>{component.technology || component.provider || item?.description}</div>
    <Handle type="source" position={Position.Right} id="out" className={`${styles.handle} ${data.showConnectors ? styles.handleVisible : ""}`} title="Connect from this component" aria-label={`Connect from ${component.name}`} />
  </div>;
}
