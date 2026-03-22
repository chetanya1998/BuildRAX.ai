import { NextResponse } from "next/server";
import { generateText } from "@/lib/litellm";

const SYSTEM_PROMPT = `
You are an expert AI Systems Reviewer. Your task is to analyze a React Flow based AI architecture (nodes/edges) and provide professional feedback.
You return a JSON object with the following fields:
- rating: 1-10 (number)
- feedback: A short professional summary of the design.
- suggestions: An array of 3 actionable improvements.
- edgeCases: An array of 3 potential failures or logical gaps (e.g., "What if LLM returns empty?").
- healthChecks: An array of boolean checks (e.g., "Has Input Node", "Has Output Node", "Connected").

Input will be a JSON containing { nodes, edges }.
If the design is broken (e.g., disconnected nodes), give a low rating and specific fix instructions.
`;

export async function POST(req: Request) {
  try {
    const { nodes, edges } = await req.json();

    if (!nodes || !edges) {
      return NextResponse.json({ error: "Missing nodes or edges" }, { status: 400 });
    }

    const response = await generateText(
      `Analyze this AI architecture: ${JSON.stringify({ nodes, edges })}`,
      SYSTEM_PROMPT,
      {
        model: "gpt-4o",
        temperature: 0.1,
        response_format: { type: "json_object" }
      }
    );

    if (!response) {
      throw new Error("AI failed to analyze the architecture");
    }

    const analysis = JSON.parse(response);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Architect Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze architecture" }, { status: 500 });
  }
}
