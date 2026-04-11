import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TemplateBlueprint } from "@/lib/models/TemplateBlueprint";
import { ensureBlueprintCatalogSeeded } from "@/lib/graph/seedBlueprints";

export async function GET(req: NextRequest) {
  try {
    await ensureBlueprintCatalogSeeded();
    await dbConnect();

    const sector = req.nextUrl.searchParams.get("sector");
    const query = req.nextUrl.searchParams.get("q");

    const filter: Record<string, unknown> = {};

    if (sector && sector !== "all") {
      filter.sector = sector;
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { useCase: { $regex: query, $options: "i" } },
        { tags: { $elemMatch: { $regex: query, $options: "i" } } },
      ];
    }

    const blueprints = await TemplateBlueprint.find(filter)
      .sort({ sector: 1, useCase: 1 })
      .lean();

    return NextResponse.json({
      blueprints,
      total: blueprints.length,
    });
  } catch (error) {
    console.error("Catalog error:", error);
    return NextResponse.json({ error: "Failed to load blueprint catalog" }, { status: 500 });
  }
}
