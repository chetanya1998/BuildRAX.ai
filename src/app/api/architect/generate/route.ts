import { NextResponse } from "next/server";
import { generateText } from "@/lib/litellm";

const SYSTEM_PROMPT = `
You are an AI System Architect. Your goal is to transform a natural language description into a structured AI workflow diagram.
You return ONLY a JSON object compatible with React Flow.

Node Types available:
- inputNode: For starting data (e.g. "User Question", "PDF Text").
- promptNode: For defining templates (e.g. "Analyze this: {{input}}").
- llmNode: For model processing.
- outputNode: For final results.
- memoryNode: For vector storage or context retrieval.
- toolNode: For external actions (API calls, search).
- conditionNode: For branching logic.
- combineNode: For merging multiple text strings.
- loopNode: For iterating over arrays.

Output Format:
{
  "nodes": [
    { "id": "1", "type": "inputNode", "position": { "x": 0, "y": 0 }, "data": { "value": "..." } },
    ...
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "animated": true },
    ...
  ]
}

Layout: Arrange nodes logically from left to right. Space them out by 250px horizontally.
Provide a professional, clean architecture that actually solves the user's request.
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const response = await generateText(
      `Design an AI architecture for: ${prompt}`,
      SYSTEM_PROMPT,
      {
        model: "gpt-4o",
        temperature: 0.2,
        response_format: { type: "json_object" }
      }
    );

    if (!response) {
      throw new Error("AI failed to generate a response");
    }

    const architecture = JSON.parse(response);

    return NextResponse.json(architecture);
  } catch (error: any) {
    console.error("Architect Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate architecture" }, { status: 500 });
  }
}
