import type { Metadata } from "next";
import { StartExperience } from "@/components/start/start-experience";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Start building" };

export default async function StartPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const authenticated = Boolean(supabase && (await supabase.auth.getUser()).data.user);
  return <StartExperience initialTemplate={template} authenticated={authenticated} />;
}
