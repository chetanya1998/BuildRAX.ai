import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPersistedProjects } from "@/lib/supabase/projects";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const projects = user ? await listPersistedProjects() : [];
  return <DashboardClient authenticated={Boolean(user)} projects={projects} />;
}
