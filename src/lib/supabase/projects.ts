import "server-only";

import { diagramSchema, type Diagram } from "@/lib/domain/schema";
import { architecturePresentationSchema, type ArchitecturePresentation } from "@/lib/architecture-ir/snapshot";
import { migrateArchitectureIR, type ArchitectureIR } from "@/lib/architecture-ir/schema";
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

export type PersistedArchitecture = {
  diagram: Diagram;
  ir: ArchitectureIR;
  presentation: ArchitecturePresentation;
  irVersion: number;
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
  return (await loadProjectArchitecture(projectId))?.diagram ?? null;
}

export async function loadProjectArchitecture(projectId: string): Promise<PersistedArchitecture | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data: diagram, error: diagramError } = await supabase
    .from("diagrams")
    .select("id, title, current_version, current_ir_version, created_at, updated_at, project_id")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (diagramError || !diagram) return null;
  const { data: artifactRows, error: versionError } = await supabase.rpc("read_architecture_version", {
    target_diagram: diagram.id,
    target_version: diagram.current_version,
  });
  const version = artifactRows?.[0];
  if (versionError || !version?.diagram_payload || !version.ir_payload || !version.presentation_payload) return null;

  const normalized = normalizeDiagram(version.diagram_payload, diagram as DiagramRow);
  return {
    diagram: normalized,
    ir: migrateArchitectureIR(version.ir_payload),
    presentation: architecturePresentationSchema.parse(version.presentation_payload),
    irVersion: Number(version.ir_version),
  };
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
