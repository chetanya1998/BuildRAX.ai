import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AIRun = {
  requestId: string;
  provider: string;
  model: string;
  status: "completed" | "failed";
  durationMs: number;
  promptVersion: string;
  attempts: number;
  errorClass?: string;
};

/** Records only operational metadata—never prompts, response payloads or secrets. */
export async function recordGenerationRun(run: AIRun) {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ai_runs").insert({
      user_id: user.id,
      kind: "generation",
      provider: run.provider,
      model: run.model,
      status: run.status,
      duration_ms: run.durationMs,
      error_class: run.errorClass ?? null,
      request_id: run.requestId,
      prompt_version: run.promptVersion,
      attempts: run.attempts,
    });
  } catch {
    // Audit telemetry is best-effort. It must never make a usable generation fail.
  }
}
