import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPersistedProjects } from "@/lib/supabase/projects";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const projects = user ? await listPersistedProjects() : [];
  const notifications = user && supabase ? (await supabase.from("user_notifications")
    .select("id, kind, diagram_id, diagram_version, message, read_at, created_at")
    .eq("user_id", user.id).is("read_at", null).order("created_at", { ascending: false }).limit(10)).data ?? [] : [];
  return <DashboardClient authenticated={Boolean(user)} projects={projects} notifications={notifications} />;
}
