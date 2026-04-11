import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { ensureBlueprintCatalogSeeded } from "@/lib/graph/seedBlueprints";
import { TemplateBlueprint } from "@/lib/models/TemplateBlueprint";
import { Workflow } from "@/lib/models/Workflow";
import { consumeCredits, CREDIT_POLICY } from "@/lib/credits";
import { DEFAULT_VIEWPORT } from "@/lib/graph/persistence";

type SessionUser = { id?: string };

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in with GitHub or Google to instantiate blueprints." },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const userId = String((session.user as SessionUser).id || "");

    await ensureBlueprintCatalogSeeded();
    await dbConnect();

    const blueprint = await TemplateBlueprint.findOne({ slug }).lean();
    if (!blueprint) {
      return NextResponse.json({ error: "Blueprint not found" }, { status: 404 });
    }

    await consumeCredits({
      userId,
      action: "template_instantiate",
      amount: CREDIT_POLICY.templateInstantiate,
      referenceType: "template_blueprint",
      referenceId: slug,
    });

    const workflow = await Workflow.create({
      name: blueprint.name,
      description: blueprint.description,
      graph: blueprint.graph,
      nodes: ((blueprint.graph as Record<string, unknown>).nodes as unknown[]) || [],
      edges: ((blueprint.graph as Record<string, unknown>).edges as unknown[]) || [],
      viewport: DEFAULT_VIEWPORT,
      creatorId: userId,
      lifecycle: "draft",
      graphVersion: "1.0",
      sourceBlueprintSlug: blueprint.slug,
      metadata: {
        ...((blueprint.graph as Record<string, unknown>).metadata as Record<string, unknown>),
        blueprintSlug: blueprint.slug,
        blueprintSector: blueprint.sector,
        blueprintUseCase: blueprint.useCase,
      },
    });

    return NextResponse.json({
      workflowId: workflow._id,
      workflow,
    });
  } catch (error) {
    console.error("Instantiate blueprint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to instantiate blueprint";
    const status = message === "Insufficient credits" ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
