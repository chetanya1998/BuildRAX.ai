import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

// Optionally enforce auth for this expensive operation
// If testing in Builder without auth, this can be removed or mocked.

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Allowing guest mode for now to support the demo state where users might not be logged in
    
    const { nodes, edges } = await req.json();

    if (!nodes || !edges) {
      return NextResponse.json({ error: "Missing nodes or edges" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Mock response for missing keys
      return NextResponse.json({
        rating: 8,
        feedback: "Your setup looks solid, but this is a mock analysis because OPENAI_API_KEY is not configured.",
        edgeCases: ["What happens if the API responds slowly?", "Missing fallback node for failure states."],
        suggestions: ["Add a condition node to check success.", "Incorporate memory for better context retrieval."]
      });
    }

    // Prepare a structured representation of the workflow DAG for the LLM to understand
    const workflowDescription = nodes.map((n: any) => 
      `Node [${n.id}] (${n.type}): ${JSON.stringify(n.data).substring(0, 100)}`
    ).join("\n");

    const edgeDescription = edges.map((e: any) => 
      `${e.source} -> ${e.target}`
    ).join("\n");

    const prompt = `
      You are an expert AI Systems Architect auditing a user's node-based workflow.
      The workflow is represented as a Directed Acyclic Graph (DAG).
      
      Nodes:
      ${workflowDescription}
      
      Connections (Edges):
      ${edgeDescription}
      
      Analyze the logic, data flow, and potential failure points of this system.
      Provide your response strictly in the following JSON format:
      {
        "rating": <number from 1 to 10>,
        "feedback": "<2-3 sentences of overall conceptual feedback>",
        "edgeCases": ["<edge case 1>", "<edge case 2>"],
        "suggestions": ["<actionable improvement 1>", "<actionable improvement 2>"]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a senior workflow optimization engineer." },
        { role: "user", content: prompt }
      ]
    });

    const resultStr = completion.choices[0]?.message?.content || "{}";
    const resultJson = JSON.parse(resultStr);

    return NextResponse.json(resultJson);

  } catch (error) {
    console.error("AI Architect Audit Error:", error);
    return NextResponse.json({ error: "Failed to audit workflow" }, { status: 500 });
  }
}
