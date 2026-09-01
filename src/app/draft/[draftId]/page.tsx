import { DraftLoader } from "@/components/editor/draft-loader";

export default async function DraftPage({ params, searchParams }: { params: Promise<{ draftId: string }>; searchParams: Promise<{ migrate?: string }> }) {
  const { draftId } = await params;
  const { migrate } = await searchParams;
  return <DraftLoader draftId={draftId} migrate={migrate === "1"} />;
}
