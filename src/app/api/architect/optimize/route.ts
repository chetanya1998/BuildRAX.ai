import { NextResponse } from "next/server";
import { generateText } from "@/lib/litellm";

const SYSTEM_PROMPT = `
You are an AI Prompt Optimizer. Your goal is to refine and optimize LLM prompts for maximum efficiency, clarity, and cost-effectiveness (minimizing tokens while maintaining quality).

When given a prompt, you should:
1.  Remove redundancy and filler words.
2.  Clarify instructions and constraints.
3.  Format as a structured prompt if appropriate (e.g., using delimiters or specific sections).
4.  Optionally suggest a better model or settings if applicable.

Return ONLY a JSON object:
{
  "optimizedPrompt": "...",
  "explanation": "Brief reasoning for the changes",
  "estimatedTokenReduction": "e.g. 15%",
  "improvements": ["Improvement 1", "Improvement 2"]
}
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const response = await generateText(
      `Optimize this prompt for an LLM: ${prompt}`,
      SYSTEM_PROMPT,
      {
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" }
      }
    );

    if (!response) {
      throw new Error("AI failed to generate a response");
    }

    const optimization = JSON.parse(response);

    return NextResponse.json(optimization);
  } catch (error: any) {
    console.error("Architect Optimization Error:", error);
    return NextResponse.json({ error: "Failed to optimize prompt" }, { status: 500 });
  }
}
