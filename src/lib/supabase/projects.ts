import "server-only";

import { diagramSchema, type Diagram } from "@/lib/domain/schema";
import { createSupabaseServerClient } from "./server";

export type PersistedProjectSummary = {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  diagramCount: number;
};

type DiagramRow = {
  id: string;
  title: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  project_id: string;
};

function normalizeDiagram(payload: unknown, row: DiagramRow): Diagram {
  const candidate = {
    ...(payload as Record<string, unknown>),
    id: row.id,
    title: row.title,
    version: row.current_version,
    createdAt: (payload as { createdAt?: string }).createdAt ?? row.created_at,
    updatedAt: row.updated_at,
  };
  return diagramSchema.parse(candidate);
}

export async function listPersistedProjects(): Promise<PersistedProjectSummary[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, updated_at, diagrams(id)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    updatedAt: project.updated_at,
    diagramCount: project.diagrams?.length ?? 0,
  }));
}

export async function loadProjectDiagram(projectId: string): Promise<Diagram | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: diagram, error: diagramError } = await supabase
    .from("diagrams")
    .select("id, title, current_version, created_at, updated_at, project_id")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (diagramError || !diagram) return null;
  const { data: version, error: versionError } = await supabase
    .from("diagram_versions")
    .select("payload")
    .eq("diagram_id", diagram.id)
    .eq("version", diagram.current_version)
    .maybeSingle();
  if (versionError || !version) return null;
  return normalizeDiagram(version.payload, diagram as DiagramRow);
}

export async function loadSharedDiagram(tokenHash: string): Promise<Diagram | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("read_shared_diagram", { target_token_hash: tokenHash });
  const shared = data?.[0] as { diagram_id: string; diagram_title: string; diagram_payload: unknown } | undefined;
  if (error || !shared) return null;
  const payload = shared.diagram_payload as Record<string, unknown>;
  return diagramSchema.safeParse({ ...payload, id: shared.diagram_id, title: shared.diagram_title }).data ?? null;
}
