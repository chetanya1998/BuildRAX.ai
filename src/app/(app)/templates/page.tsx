"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  CopyPlus,
  Filter,
  Layers,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkflowNode {
  id: string;
  type: string;
}

interface WorkflowGraphPreview {
  nodes: WorkflowNode[];
  edges: Array<{ id: string }>;
}

interface BlueprintRecord {
  _id: string;
  slug: string;
  name: string;
  description: string;
  sector: string;
  useCase: string;
  maturity: "starter" | "production";
  tags: string[];
  requiredConnectors: string[];
  configurableParameters: string[];
  analysisRubric: string[];
  benchmarkRubric: string[];
  estimatedCreditCost: number;
  graph: WorkflowGraphPreview;
}

interface CatalogResponse {
  blueprints: BlueprintRecord[];
  total: number;
}

interface CommunityTemplateRecord {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  averageRating?: number;
  clones?: number;
  nodes?: unknown[];
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
};

function formatPackCount(blueprint: BlueprintRecord) {
  const nodeCount = blueprint.graph?.nodes?.length || 0;
  const connectorCount = blueprint.requiredConnectors?.length || 0;
  return `${nodeCount} nodes • ${connectorCount} connectors`;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [activeTab, setActiveTab] = useState<"enterprise" | "community">("enterprise");
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintRecord | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityTemplateRecord | null>(null);
  const [instantiatingSlug, setInstantiatingSlug] = useState<string | null>(null);
  const [cloningTemplateId, setCloningTemplateId] = useState<string | null>(null);

  const catalogQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (sector !== "all") params.set("sector", sector);
    return `/api/templates/catalog?${params.toString()}`;
  }, [query, sector]);

  const {
    data: catalogData,
    error: catalogError,
    isLoading: isCatalogLoading,
  } = useSWR<CatalogResponse>(catalogQuery, fetcher);

  const {
    data: communityTemplates,
    error: communityError,
    isLoading: isCommunityLoading,
  } = useSWR<CommunityTemplateRecord[]>("/api/templates", fetcher);

  const sectors = useMemo(() => {
    const allSectors = (catalogData?.blueprints || []).map((blueprint) => blueprint.sector);
    return ["all", ...Array.from(new Set(allSectors))];
  }, [catalogData?.blueprints]);

  const filteredCommunity = useMemo(() => {
    const templates = communityTemplates || [];
    if (!query.trim()) return templates;
    const q = query.toLowerCase();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(q) ||
        (template.description || "").toLowerCase().includes(q) ||
        (template.category || "").toLowerCase().includes(q)
    );
  }, [communityTemplates, query]);

  const handleInstantiateBlueprint = async (slug: string) => {
    try {
      setInstantiatingSlug(slug);
      const response = await fetch(`/api/templates/catalog/${slug}/instantiate`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to instantiate blueprint");
      }
      toast.success("Blueprint instantiated. Opening the builder...");
      router.push(`/builder?id=${payload.workflowId}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Instantiation failed");
    } finally {
      setInstantiatingSlug(null);
    }
  };

  const handleCloneCommunityTemplate = async (templateId: string) => {
    try {
      setCloningTemplateId(templateId);
      const response = await fetch(`/api/templates/${templateId}/clone`, {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to clone template");
      }
      toast.success("Community template cloned. Opening the builder...");
      router.push(`/builder?id=${payload.workflowId}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Clone failed");
    } finally {
      setCloningTemplateId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-10">
      <div className="glass-panel p-6 md:p-9 rounded-3xl border border-border/40 relative overflow-hidden bg-card/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[110px] -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 space-y-5">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Production Blueprint Catalog
          </Badge>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Enterprise Automation Templates
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Start from curated production-grade blueprints across B2B, B2C, Fintech, D2C, E-Commerce, Payroll,
                HR, Marketing, Sales, and Support. Every blueprint instantiates into a real editable workflow.
              </p>
            </div>
            <Button className="rounded-xl h-11 px-6" onClick={() => router.push("/builder")}>
              <BrainCircuit className="w-4 h-4 mr-2" />
              Open AI Architect
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-background/40 border-white/10 rounded-xl"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by blueprint name, use case, sector, or tags..."
          />
        </div>
        <div className="w-full md:w-72">
          <Select value={sector} onValueChange={(value) => setSector(value || "all")}>
            <SelectTrigger className="h-11 rounded-xl bg-background/40 border-white/10">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sectorOption) => (
                <SelectItem key={sectorOption} value={sectorOption}>
                  {sectorOption === "all" ? "All sectors" : sectorOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "enterprise" | "community")}>
        <TabsList className="bg-card/20 border border-border/40 inline-flex h-auto p-1.5 rounded-2xl">
          <TabsTrigger value="enterprise" className="rounded-xl px-4 py-2">
            Enterprise Catalog
          </TabsTrigger>
          <TabsTrigger value="community" className="rounded-xl px-4 py-2">
            Community Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enterprise" className="mt-6 space-y-6">
          {catalogError ? (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle>Failed to load blueprint catalog</CardTitle>
                <CardDescription>{catalogError.message}</CardDescription>
              </CardHeader>
            </Card>
          ) : isCatalogLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={`catalog-skeleton-${index}`} className="h-[260px] rounded-2xl bg-card/40" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {(catalogData?.total || 0)} blueprints available
                </p>
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {(catalogData?.blueprints || []).map((blueprint) => (
                  <Card
                    key={blueprint.slug}
                    className="bg-card/20 border-border/40 hover:border-primary/30 transition-all rounded-2xl overflow-hidden"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="border-white/10">
                          {blueprint.sector}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-snug">{blueprint.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-2">
                          {blueprint.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">{formatPackCount(blueprint)}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(blueprint.tags || []).slice(0, 4).map((tag) => (
                          <span
                            key={`${blueprint.slug}-${tag}`}
                            className="text-[10px] px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t border-white/5 bg-black/10">
                      <Button
                        className="flex-1 rounded-xl"
                        onClick={() => handleInstantiateBlueprint(blueprint.slug)}
                        disabled={instantiatingSlug === blueprint.slug}
                      >
                        {instantiatingSlug === blueprint.slug ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CopyPlus className="w-4 h-4 mr-2" />
                        )}
                        Use Blueprint
                      </Button>
                      <Button variant="outline" className="rounded-xl" onClick={() => setSelectedBlueprint(blueprint)}>
                        View
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="mt-6 space-y-6">
          {communityError ? (
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle>Failed to load community templates</CardTitle>
                <CardDescription>{communityError.message}</CardDescription>
              </CardHeader>
            </Card>
          ) : isCommunityLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`community-skeleton-${index}`} className="h-[220px] rounded-2xl bg-card/40" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCommunity.map((template) => (
                <Card
                  key={template._id}
                  className="bg-card/20 border-border/40 hover:border-primary/30 transition-all rounded-2xl overflow-hidden"
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-secondary/20 border border-white/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <Badge variant="outline" className="border-white/10">
                        {template.category || "Community"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || "Community-contributed template."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {(template.nodes?.length || 0)} nodes • {template.clones || 0} clones
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rating: {(template.averageRating || 0).toFixed(1)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2 border-t border-white/5 bg-black/10">
                    <Button
                      className="flex-1 rounded-xl"
                      onClick={() => handleCloneCommunityTemplate(template._id)}
                      disabled={cloningTemplateId === template._id}
                    >
                      {cloningTemplateId === template._id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CopyPlus className="w-4 h-4 mr-2" />
                      )}
                      Clone
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => setSelectedCommunity(template)}>
                      View
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedBlueprint} onOpenChange={(open) => !open && setSelectedBlueprint(null)}>
        <DialogContent className="max-w-3xl bg-[#09090b] border border-white/10 rounded-3xl p-0 overflow-hidden">
          {selectedBlueprint ? (
            <div className="grid md:grid-cols-[320px_1fr]">
              <div className="p-7 border-r border-white/5 bg-black/40 space-y-6">
                <div className="space-y-2">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {selectedBlueprint.sector}
                  </Badge>
                  <h3 className="text-2xl font-bold leading-tight">{selectedBlueprint.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedBlueprint.description}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Use Case</p>
                  <p className="font-semibold">{selectedBlueprint.useCase}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Estimated Credits</p>
                  <p className="font-semibold">{selectedBlueprint.estimatedCreditCost}</p>
                </div>
                <Button
                  className="w-full rounded-xl"
                  onClick={() => handleInstantiateBlueprint(selectedBlueprint.slug)}
                  disabled={instantiatingSlug === selectedBlueprint.slug}
                >
                  {instantiatingSlug === selectedBlueprint.slug ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Instantiate Blueprint
                </Button>
              </div>

              <div className="p-7 space-y-6">
                <DialogHeader className="space-y-2">
                  <DialogTitle>Production Blueprint Details</DialogTitle>
                  <DialogDescription>
                    Review connectors, analysis rubric, and benchmark rubric before instantiation.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Required Connectors</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedBlueprint.requiredConnectors.map((connector) => (
                      <span key={connector} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {connector}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Analysis Rubric</h4>
                  <div className="space-y-2">
                    {selectedBlueprint.analysisRubric.map((item, index) => (
                      <div key={`analysis-${index}`} className="text-sm text-muted-foreground bg-card/40 border border-white/10 rounded-xl px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-muted-foreground">Benchmark Rubric</h4>
                  <div className="space-y-2">
                    {selectedBlueprint.benchmarkRubric.map((item, index) => (
                      <div key={`benchmark-${index}`} className="text-sm text-muted-foreground bg-card/40 border border-white/10 rounded-xl px-3 py-2">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCommunity} onOpenChange={(open) => !open && setSelectedCommunity(null)}>
        <DialogContent className="max-w-xl bg-[#09090b] border border-white/10 rounded-2xl">
          {selectedCommunity ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCommunity.name}</DialogTitle>
                <DialogDescription>
                  Community template preview.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{selectedCommunity.description || "No description provided."}</p>
                <p>Category: {selectedCommunity.category || "Community"}</p>
                <p>Nodes: {selectedCommunity.nodes?.length || 0}</p>
                <p>Clones: {selectedCommunity.clones || 0}</p>
                <p>Rating: {(selectedCommunity.averageRating || 0).toFixed(1)}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  className="rounded-xl"
                  onClick={() => handleCloneCommunityTemplate(selectedCommunity._id)}
                  disabled={cloningTemplateId === selectedCommunity._id}
                >
                  {cloningTemplateId === selectedCommunity._id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Clone to Builder
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
