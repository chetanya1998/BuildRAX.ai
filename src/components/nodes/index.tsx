import React from "react";
import { BaseNode } from "./BaseNode";
import { Type, MessageSquareCode, Bot, TerminalSquare, Database, Cog, PlusSquare, Repeat, CheckCircle2 } from "lucide-react";

export const InputNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Input" 
    icon={<Type className="w-4 h-4" />} 
    colorClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
    selected={selected} 
    outputs={[{ id: "default" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs line-clamp-2 italic">
      {data.value || "Initial string or dataset to pass down"}
    </div>
  </BaseNode>
);

export const PromptNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Prompt Template" 
    icon={<MessageSquareCode className="w-4 h-4" />} 
    colorClass="bg-orange-500/10 text-orange-500 border-orange-500/20"
    selected={selected} 
    inputs={[{ id: "input" }]} 
    outputs={[{ id: "prompt" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs line-clamp-3">
      {data.template || "Define your text template, use {{input}}"}
    </div>
  </BaseNode>
);

export const LLMNode = ({ data, selected }: any) => (
  <BaseNode 
    title={`LLM (${data.model || 'GPT-3.5'})`} 
    icon={<Bot className="w-4 h-4" />} 
    colorClass="bg-purple-500/10 text-purple-500 border-purple-500/20"
    selected={selected} 
    inputs={[{ id: "prompt" }]} 
    outputs={[{ id: "default" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs flex flex-col gap-1">
      <span className="line-clamp-2"><b>System:</b> {data.systemPrompt || "None"}</span>
      <span><b>Temp:</b> {data.temperature || 0.7}</span>
    </div>
  </BaseNode>
);

export const OutputNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Output" 
    icon={<TerminalSquare className="w-4 h-4" />} 
    colorClass="bg-green-500/10 text-green-500 border-green-500/20"
    selected={selected} 
    inputs={[{ id: "default" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs italic">
      {data.label || "Returns the final response sequence to the user"}
    </div>
  </BaseNode>
);

// Advanced Nodes Added
export const MemoryNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Vector Memory" 
    icon={<Database className="w-4 h-4" />} 
    colorClass="bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    selected={selected} 
    inputs={[{ id: "query" }]} 
    outputs={[{ id: "context" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs line-clamp-2">
      {data.collection || "Queries pinecone for semantic chunks"}
    </div>
  </BaseNode>
);

export const ToolNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Custom Tool" 
    icon={<Cog className="w-4 h-4" />} 
    colorClass="bg-red-500/10 text-red-500 border-red-500/20"
    selected={selected} 
    inputs={[{ id: "args" }]} 
    outputs={[{ id: "result" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs font-mono">
      {data.functionName || "api_request()"}
    </div>
  </BaseNode>
);

export const ConditionNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Condition (If/Else)" 
    icon={<CheckCircle2 className="w-4 h-4" />} 
    colorClass="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    selected={selected} 
    inputs={[{ id: "input" }]} 
    outputs={[{ id: "true", label: "True" }, { id: "false", label: "False" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs italic">
      {data.expression || "Routes execution based on a boolean check"}
    </div>
  </BaseNode>
);

export const CombineNode = ({ data, selected }: any) => (
  <BaseNode 
    title="Combine Strings" 
    icon={<PlusSquare className="w-4 h-4" />} 
    colorClass="bg-teal-500/10 text-teal-500 border-teal-500/20"
    selected={selected} 
    inputs={[{ id: "a" }, { id: "b" }]} 
    outputs={[{ id: "merged" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs">
      {data.separator || "Merges multiple text streams together"}
    </div>
  </BaseNode>
);

export const LoopNode = ({ data, selected }: any) => (
  <BaseNode 
    title="For-Each Loop" 
    icon={<Repeat className="w-4 h-4" />} 
    colorClass="bg-pink-500/10 text-pink-500 border-pink-500/20"
    selected={selected} 
    inputs={[{ id: "array" }]} 
    outputs={[{ id: "item" }]}
    isSimulating={data.isSimulating}
    simulatedOutput={data.simulatedOutput}
  >
    <div className="text-muted-foreground text-xs">
      {data.maxIterations ? `Max loops: ${data.maxIterations}` : "Iterates over a list"}
    </div>
  </BaseNode>
);

export const nodeTypes = {
  inputNode: InputNode,
  promptNode: PromptNode,
  llmNode: LLMNode,
  outputNode: OutputNode,
  memoryNode: MemoryNode,
  toolNode: ToolNode,
  conditionNode: ConditionNode,
  combineNode: CombineNode,
  loopNode: LoopNode,
};
