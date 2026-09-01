import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  return <DashboardClient authenticated={Boolean(user)} />;
}
