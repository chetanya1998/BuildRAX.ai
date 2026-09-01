import { NextResponse } from "next/server";
import { createNode } from "@/lib/domain/factory";
import { SCHEMA_VERSION, changePlanSchema, diagramSchema } from "@/lib/domain/schema";
import { apiError, readJson } from "@/lib/server/http";
import { assertRateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const requestSchema = z.object({ diagram: diagramSchema, command: z.string().trim().min(4).max(1000) }).strict();

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "change-plan", 12);
    const { diagram, command } = requestSchema.parse(await readJson(request));
    const normalized = command.toLowerCase();
    const semanticType = normalized.includes("cache") ? "cache" : normalized.includes("identity") || normalized.includes("auth") ? "identity-provider" : normalized.includes("queue") ? "queue" : "observability";
    const existing = diagram.nodes.find((node) => node.semanticType === semanticType);
    const addedNodes = existing ? [] : [createNode(semanticType, crypto.randomUUID(), semanticType === "observability" ? "Observability" : semanticType === "identity-provider" ? "Identity provider" : semanticType === "cache" ? "Application cache" : "Work queue", 820, 420)];
    const plan = changePlanSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      baseVersion: diagram.version,
      addedNodes,
      changedNodes: [],
      removedNodeIds: [],
      addedConnectors: [],
      removedConnectorIds: [],
      warnings: existing ? [`${existing.name} already covers this responsibility; no automatic mutation is proposed.`] : ["Confirm ownership, capacity and failure behavior before implementation."],
    });
    return NextResponse.json({ plan });
  } catch (error) { return apiError(error); }
}
