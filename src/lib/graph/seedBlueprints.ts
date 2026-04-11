import dbConnect from "@/lib/mongodb";
import { TemplateBlueprint } from "@/lib/models/TemplateBlueprint";
import { ENTERPRISE_BLUEPRINTS } from "./blueprints";

let seeded = false;

export async function ensureBlueprintCatalogSeeded() {
  if (seeded) return;

  await dbConnect();

  await Promise.all(
    ENTERPRISE_BLUEPRINTS.map((blueprint) =>
      TemplateBlueprint.findOneAndUpdate(
        { slug: blueprint.slug },
        { $set: blueprint },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  seeded = true;
}
