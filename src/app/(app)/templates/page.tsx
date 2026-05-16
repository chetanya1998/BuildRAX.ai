"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Building2,
  Car,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  Layers,
  MessageSquare,
  Search,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TemplateIntroModal } from "@/components/guidance/TemplateIntroModal";
import { BUILD_RAX_TEMPLATE_CATALOG } from "@/lib/data/buildraxCatalog";
import { explainTemplateForBeginner } from "@/lib/guidance/explanations";
import { getDefaultNodeData, getNodeDefinition, LAUNCH_TEMPLATE_COUNT, MVP_TEMPLATE_IDS } from "@/lib/graph/catalog";
import { WorkflowGraph } from "@/lib/graph/types";

type TemplateRecord = (typeof BUILD_RAX_TEMPLATE_CATALOG)[number];

const productIcons: Record<string, LucideIcon> = {
  SaaS: Layers,
  CRM: BriefcaseBusiness,
  Support: MessageSquare,
  Marketplace: Store,
  Fintech: Landmark,
  Ecommerce: ShoppingCart,
  "Consumer App": Users,
  Education: GraduationCap,
  Health: HeartHandshake,
  Fitness: Dumbbell,
  Mobility: Car,
  "Real Estate": Home,
};

function iconFor(template: TemplateRecord) {
  return productIcons[template.product_type] || productIcons[template.category] || Building2;
}

function resolveNodeId(nodeId: string) {
  if (getNodeDefinition(nodeId)) return nodeId;
  return getNodeDefinition("user_defined_component") ? "user_defined_component" : nodeId;
}

function graphFor(template: TemplateRecord): WorkflowGraph {
  const resolvedNodes = template.recommended_nodes.map((node) => ({
    ...node,
    resolvedId: resolveNodeId(node.node_id),
  }));

  return {
    version: "1.0",
    metadata: {
      name: template.name,
      description: template.description,
      mode: "design",
      tags: [template.category, template.product_type, ...template.core_flow.slice(0, 4)],
      assumptions: [...template.validation_checks],
      suggestedScenarios: [...template.simulation_profile.default_scenarios],
    },
    nodes: resolvedNodes.map((node, index) => ({
      id: `${node.resolvedId}-${index + 1}`,
      type: node.resolvedId,
      position: { x: 80 + (index % 4) * 320, y: 100 + Math.floor(index / 4) * 190 },
      data: {
        ...getDefaultNodeData(node.resolvedId),
        label: node.name,
        catalog_node_id: node.node_id,
        catalog_match: node.catalog_match,
        fallback_type: node.fallback_type,
      },
    })),
    edges: resolvedNodes.slice(1).map((_, index) => ({
      id: `edge-${index + 1}`,
      source: `${resolvedNodes[index].resolvedId}-${index + 1}`,
      target: `${resolvedNodes[index + 1].resolvedId}-${index + 2}`,
      animated: true,
    })),
  };
}

export default function TemplatesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [creating, setCreating] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateRecord | null>(null);

  const categories = useMemo(() => ["all", ...Array.from(new Set(BUILD_RAX_TEMPLATE_CATALOG.map((template) => template.category)))], []);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return BUILD_RAX_TEMPLATE_CATALOG.filter((template) => {
      const categoryMatch = category === "all" || template.category === category;
      const queryMatch =
        !q ||
        [
          template.id,
          template.name,
          template.category,
          template.product_type,
          template.description,
          ...template.core_flow,
          ...template.recommended_nodes.map((node) => node.name),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const createFromTemplate = async (template: TemplateRecord) => {
    setCreating(template.id);
    try {
      const graph = graphFor(template);
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: graph.metadata.name,
          description: graph.metadata.description,
          graph,
          nodes: graph.nodes,
          edges: graph.edges,
          sourceBlueprintSlug: template.id,
          lifecycle: "draft",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to use template");
      toast.success("Template opened in builder");
      setSelectedTemplate(null);
      router.push(`/builder?id=${payload._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to use template");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 rounded-md border-[#2F7BFF]/25 bg-[#2F7BFF]/10 text-[#9EC0FF]">
            {BUILD_RAX_TEMPLATE_CATALOG.length} Templates / {LAUNCH_TEMPLATE_COUNT} MVP Launch Picks
          </Badge>
          <h1 className="text-2xl font-semibold text-white">Backend blueprint templates</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            A 100-template catalog across SaaS, consumer apps, marketplaces, fintech, commerce, learning, mobility, and operations workflows.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-[520px] md:flex-row">
          <select
            className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-slate-200 outline-none"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>{item === "all" ? "All categories" : item}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input className="rounded-lg border-white/10 bg-black/20 pl-9" placeholder="Search templates, flows, nodes" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((template) => {
          const Icon = iconFor(template);
          const isMvp = (MVP_TEMPLATE_IDS as readonly string[]).includes(template.id);
          return (
            <div key={template.id} className="flex min-h-[310px] flex-col rounded-lg border border-white/10 bg-[#101726]/55 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/10">
                  <Icon className="h-5 w-5 text-[#9EC0FF]" />
                </div>
                <div className="flex gap-1">
                  {isMvp ? <Badge className="rounded-md border-emerald-400/20 bg-emerald-500/10 text-emerald-200">MVP</Badge> : null}
                  <Badge className="rounded-md border-white/10 bg-white/[0.04] text-slate-300">{template.product_type}</Badge>
                </div>
              </div>
              <h2 className="text-sm font-semibold text-white">{template.name}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{template.description}</p>
              <div className="mt-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Core Flow</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{template.core_flow.join(" -> ")}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {template.recommended_nodes.slice(0, 4).map((node) => (
                  <span key={`${template.id}-${node.node_id}-${node.name}`} className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-400">
                    {node.name}
                  </span>
                ))}
                {template.recommended_nodes.length > 4 ? (
                  <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-500">+{template.recommended_nodes.length - 4}</span>
                ) : null}
              </div>
              <div className="mt-auto pt-5">
                <Button className="w-full rounded-lg bg-[#2F7BFF] text-white hover:bg-[#5B96FF]" onClick={() => setSelectedTemplate(template)} disabled={creating === template.id}>
                  {creating === template.id ? "Creating..." : "Preview and use"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <TemplateIntroModal
        intro={selectedTemplate ? explainTemplateForBeginner(selectedTemplate) : null}
        onClose={() => setSelectedTemplate(null)}
        onUseTemplate={() => selectedTemplate && createFromTemplate(selectedTemplate)}
        isCreating={creating === selectedTemplate?.id}
      />
    </div>
  );
}
