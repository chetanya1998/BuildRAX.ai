import React from "react";
import { BaseNode } from "./BaseNode";
import { IntegrationNode } from "./IntegrationNode";
import { 
  Type, MessageSquareCode, Bot, TerminalSquare, Database, Cog, 
  PlusSquare, Repeat, CheckCircle2, Globe, Search, Newspaper,
  BookOpen, Warehouse, Table, Mail, Slack, Disc, Twitter, 
  Clock, Zap, Code, ShieldCheck, Image as ImageIcon, Mic, 
  AudioLines, ShoppingCart, CreditCard, BrainCircuit, Sparkles, Layers
} from "lucide-react";

export const InputNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Input" icon={<Type className="w-4 h-4" />} 
    colorClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
    selected={selected} outputs={[{ id: "default" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  >
    <div className="text-muted-foreground text-[10px] line-clamp-1 italic">{data.value || "Initial data"}</div>
  </BaseNode>
);

export const PromptNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Prompt" icon={<MessageSquareCode className="w-4 h-4" />} 
    colorClass="bg-orange-500/10 text-orange-500 border-orange-500/20"
    selected={selected} inputs={[{ id: "input" }]} outputs={[{ id: "prompt" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  >
    <div className="text-muted-foreground text-[10px] line-clamp-2">{data.template || "Define template"}</div>
  </BaseNode>
);

export const LLMNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title={`LLM (${data.model || 'GPT-4o'})`} icon={<Bot className="w-4 h-4" />} 
    colorClass="bg-purple-500/10 text-purple-500 border-purple-500/20"
    selected={selected} inputs={[{ id: "prompt" }]} outputs={[{ id: "default" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  >
    <div className="text-[10px] opacity-60">Temperature: {data.temperature || 0.7}</div>
  </BaseNode>
);

export const OutputNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Output" icon={<TerminalSquare className="w-4 h-4" />} 
    colorClass="bg-green-500/10 text-green-500 border-green-500/20"
    selected={selected} inputs={[{ id: "default" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const SearchNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Google Search" icon={<Search className="w-4 h-4" />} 
    colorClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
    selected={selected} inputs={[{ id: "query" }]} outputs={[{ id: "results" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const ScraperNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Web Scraper" icon={<Globe className="w-4 h-4" />} 
    colorClass="bg-teal-500/10 text-teal-500 border-teal-500/20"
    selected={selected} inputs={[{ id: "url" }]} outputs={[{ id: "content" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const MemoryNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Vector DB" icon={<Database className="w-4 h-4" />} 
    colorClass="bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    selected={selected} inputs={[{ id: "query" }]} outputs={[{ id: "context" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const SlackNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Slack" icon={<Slack className="w-4 h-4" />} 
    colorClass="bg-purple-500/10 text-purple-500 border-purple-500/20"
    selected={selected} inputs={[{ id: "message" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const DiscordNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Discord" icon={<Disc className="w-4 h-4" />} 
    colorClass="bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    selected={selected} inputs={[{ id: "message" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const TwitterNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Twitter" icon={<Twitter className="w-4 h-4" />} 
    colorClass="bg-sky-500/10 text-sky-500 border-sky-500/20"
    selected={selected} inputs={[{ id: "content" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const EmailNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Email" icon={<Mail className="w-4 h-4" />} 
    colorClass="bg-blue-500/10 text-blue-500 border-blue-500/20"
    selected={selected} inputs={[{ id: "body" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const ConditionNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Condition" icon={<CheckCircle2 className="w-4 h-4" />} 
    colorClass="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    selected={selected} inputs={[{ id: "input" }]} 
    outputs={[{ id: "true", label: "True" }, { id: "false", label: "False" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const LoopNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Loop" icon={<Repeat className="w-4 h-4" />} 
    colorClass="bg-pink-500/10 text-pink-500 border-pink-500/20"
    selected={selected} inputs={[{ id: "array" }]} outputs={[{ id: "item" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const ImageGenNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Image Generator" icon={<ImageIcon className="w-4 h-4" />} 
    colorClass="bg-pink-500/10 text-pink-500 border-pink-500/20"
    selected={selected} inputs={[{ id: "prompt" }]} outputs={[{ id: "image" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const NewsNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="News Feed" icon={<Newspaper className="w-4 h-4" />} 
    colorClass="bg-red-500/10 text-red-500 border-red-500/20"
    selected={selected} inputs={[{ id: "topic" }]} outputs={[{ id: "articles" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const CombineNode = ({ id, data, selected }: any) => (
  <BaseNode 
    id={id}
    title="Combine" icon={<PlusSquare className="w-4 h-4" />} 
    colorClass="bg-teal-500/10 text-teal-500 border-teal-500/20"
    selected={selected} inputs={[{ id: "a" }, { id: "b" }]} outputs={[{ id: "merged" }]}
    isSimulating={data.isSimulating} simulatedOutput={data.simulatedOutput}
    onDelete={data.onDelete} onEdit={data.onEdit}
  />
);

export const nodeTypes = {
  inputNode: InputNode,
  promptNode: PromptNode,
  llmNode: LLMNode,
  outputNode: OutputNode,
  searchNode: SearchNode,
  scraperNode: ScraperNode,
  memoryNode: MemoryNode,
  slackNode: SlackNode,
  discordNode: DiscordNode,
  twitterNode: TwitterNode,
  emailNode: EmailNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  combineNode: CombineNode,
  imageGenNode: ImageGenNode,
  newsNode: NewsNode,
  integrationNode: IntegrationNode,
  // Add more as needed
};
