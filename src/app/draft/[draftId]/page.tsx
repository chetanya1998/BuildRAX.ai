import { DraftLoader } from "@/components/editor/draft-loader";

export default async function DraftPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return <DraftLoader draftId={draftId} />;
}
