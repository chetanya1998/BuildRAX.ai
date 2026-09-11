import { SignInClient } from "@/components/auth/sign-in-client";
import { safeAuthReturnPath } from "@/lib/auth/return-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const query = await searchParams;
  const nextPath = safeAuthReturnPath(query.next);
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) redirect(nextPath as Route);
  return <SignInClient nextPath={nextPath} authError={query.error} />;
}
