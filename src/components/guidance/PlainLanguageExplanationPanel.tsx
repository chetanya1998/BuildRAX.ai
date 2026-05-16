import { PlainLanguageExplanation } from "@/lib/guidance/explanations";

export function PlainLanguageExplanationPanel({ explanation }: { explanation: PlainLanguageExplanation }) {
  const rows = [
    ["What are we testing?", explanation.whatTesting],
    ["How are we testing it?", explanation.howTesting],
    ["Why is it important?", explanation.whyImportant],
    ["What should happen?", explanation.expectedResult],
    ["What actually happened?", explanation.actualResult],
    ["What should be fixed first?", explanation.fixFirst],
  ];

  return (
    <div className="rounded-lg border border-[#2F7BFF]/20 bg-[#2F7BFF]/8 p-4">
      <p className="text-sm font-semibold text-white">{explanation.title}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
