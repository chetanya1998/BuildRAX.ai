import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeAuthReturnPath, signInPath } from "@/lib/auth/return-path";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeAuthReturnPath(url.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL(`${signInPath(next)}&error=not-configured`, url.origin));
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`${signInPath(next)}&error=failed`, url.origin));
}
