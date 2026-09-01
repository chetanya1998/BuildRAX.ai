import type { Metadata } from "next";
import { StartExperience } from "@/components/start/start-experience";

export const metadata: Metadata = { title: "Start building" };

export default async function StartPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  return <StartExperience initialTemplate={template} />;
}
