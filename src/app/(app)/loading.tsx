import { FancyLoader } from "@/components/ui/FancyLoader";

export default function Loading() {
  return (
    <div className="flex-1 w-full h-full min-h-[50vh] flex items-center justify-center bg-surface/50">
      <FancyLoader text="Loading Area..." />
    </div>
  );
}
