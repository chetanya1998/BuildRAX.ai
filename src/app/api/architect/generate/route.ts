import { NextResponse } from "next/server";
import { generateText } from "@/lib/litellm";

const SYSTEM_PROMPT = `
You are an AI System Architect. Your goal is to transform a natural language description into a structured AI workflow diagram.
You return ONLY a JSON object compatible with React Flow.

Node Types available:
- AI Models: llmNode (GPT-4o, Claude, Llama 3), imageGenNode (DALL-E 3), whisperNode (Audio-to-Text), ttsNode (Text-to-Speech).
- Search & Knowledge: searchNode (Google Search), scraperNode (Web Content), newsNode (Headlines), wikiNode (Wikipedia).
- Data & Storage: memoryNode (Vector DB), mongoNode (JSON), sheetsNode (Google Sheets), notionNode (Pages), airtableNode (Database).
- Logic & Flow: inputNode, promptNode, outputNode, conditionNode (If/Else), combineNode (Merge), loopNode (Arrays), delayNode (Sleep), webhookNode (API), codeNode (Custom JS).
- Integrations: slackNode, discordNode, twitterNode (X), emailNode (SMTP), stripeNode (Payments), shopifyNode (E-commerce).
- Security: authNode (API Guard).

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
