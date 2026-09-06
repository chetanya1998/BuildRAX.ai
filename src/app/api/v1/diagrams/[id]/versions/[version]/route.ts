import { NextResponse } from "next/server";
import { apiError, HttpError } from "@/lib/server/http";
import { readArchitectureVersion } from "@/lib/supabase/architecture-artifacts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  try {
    const { id: rawId, version: rawVersion } = await params;
    const id = z.string().uuid().parse(rawId);
    const version = Number(rawVersion);
    if (!Number.isInteger(version) || version < 1) throw new HttpError(400, "Version must be a positive integer.");
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new HttpError(503, "Persistence is not configured.");
    const snapshot = await readArchitectureVersion(supabase, id, version);
    return NextResponse.json({ snapshot }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
