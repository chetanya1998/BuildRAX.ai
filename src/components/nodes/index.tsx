import React from "react";
import { NodeProps } from "@xyflow/react";
import { Bot, Cpu, Database, Globe, ShieldCheck, TerminalSquare, Zap } from "lucide-react";
import { BaseNode } from "./BaseNode";
import { NODE_DEFINITION_MAP } from "@/lib/graph/catalog";

function getNodeIcon(type: string) {
  if (type.includes("http") || type.includes("webhook") || type.includes("apiGateway")) {
    return <Globe className="w-4 h-4" />;
  }
  if (type.includes("mongo") || type.includes("redis") || type.includes("postgres") || type.includes("vector") || type.includes("storage") || type.includes("queue")) {
    return <Database className="w-4 h-4" />;
  }
  if (type.includes("auth") || type.includes("rbac") || type.includes("secrets") || type.includes("pii")) {
    return <ShieldCheck className="w-4 h-4" />;
  }
  if (type.includes("retry") || type.includes("timeout") || type.includes("rate") || type.includes("fallback") || type.includes("circuit")) {
    return <Zap className="w-4 h-4" />;
  }
  if (type.includes("service") || type.includes("function") || type.includes("scheduler")) {
    return <Cpu className="w-4 h-4" />;
  }
  if (type.includes("prompt") || type.includes("llm") || type.includes("embed") || type.includes("classify") || type.includes("extract") || type.includes("summarize") || type.includes("memory") || type.includes("router") || type.includes("evaluator")) {
    return <Bot className="w-4 h-4" />;
  }
  return <TerminalSquare className="w-4 h-4" />;
}

function renderPreviewValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function DynamicNode({ id, data, selected, type }: NodeProps) {
  const definition = NODE_DEFINITION_MAP[type];
  const nodeData = (data || {}) as Record<string, unknown> & {
    label?: string;
    isSimulating?: boolean;
    simulatedOutput?: unknown;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
  };

  if (!definition) {
    return (
      <BaseNode
        id={id}
        title={String(nodeData.label || type)}
        icon={<TerminalSquare className="w-4 h-4" />}
        colorClass="bg-zinc-500/10 text-zinc-300 border-zinc-500/20"
        selected={selected}
        inputs={[{ id: "default" }]}
        outputs={[{ id: "default" }]}
        isSimulating={Boolean(nodeData.isSimulating)}
        simulatedOutput={nodeData.simulatedOutput}
        onDelete={nodeData.onDelete}
        onEdit={nodeData.onEdit}
      >
        <div className="text-[10px] text-muted-foreground line-clamp-2">
          Unsupported or legacy node. Open properties to inspect raw data.
        </div>
      </BaseNode>
    );
  }

  const preview = (definition.previewFields || [])
    .map((fieldName) => renderPreviewValue(nodeData[fieldName]))
    .filter(Boolean)
    .slice(0, 2);

  return (
      <BaseNode
        id={id}
      title={String(nodeData.label || definition.title)}
      icon={getNodeIcon(type)}
      colorClass={definition.colorClass}
      selected={selected}
      inputs={definition.inputs}
      outputs={definition.outputs}
      isSimulating={Boolean(nodeData.isSimulating)}
      simulatedOutput={nodeData.simulatedOutput}
      onDelete={nodeData.onDelete}
      onEdit={nodeData.onEdit}
    >
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground/80 line-clamp-2">
          {definition.description}
        </p>
        {preview.length > 0 ? (
          <div className="space-y-1">
            {preview.map((value, index) => (
              <div key={`${type}-${index}`} className="text-[10px] text-muted-foreground line-clamp-2 font-mono">
                {value}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground/60">
            {definition.pack.toUpperCase()} / {definition.category}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

export const nodeTypes = Object.fromEntries(
  Object.keys(NODE_DEFINITION_MAP).map((type) => [type, DynamicNode])
);
