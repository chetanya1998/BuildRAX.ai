import "server-only";

import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HttpError } from "@/lib/server/http";

export type GenerationJobIdentity = {
  subjectKey: string;
  userId: string;
  workspaceId: string | null;
};

export async function resolveGenerationJobIdentity(): Promise<GenerationJobIdentity> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new HttpError(503, "Generation job authentication is not configured.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new HttpError(401, "Sign in to use resumable generation.");
  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "editor"])
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new HttpError(503, "Generation workspace membership could not be resolved.");
  return {
    subjectKey: createHash("sha256").update(`user:${user.id}`).digest("hex"),
    userId: user.id,
    workspaceId: membership?.workspace_id ?? null,
  };
}
