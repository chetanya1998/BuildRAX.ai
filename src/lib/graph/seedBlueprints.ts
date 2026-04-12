import { TemplateBlueprint } from "@/lib/models/TemplateBlueprint";
import { ENTERPRISE_BLUEPRINTS } from "./blueprints";

let seeded = false;

export async function ensureBlueprintCatalogSeeded() {
  if (seeded) return;

  await Promise.all(
    ENTERPRISE_BLUEPRINTS.map((blueprint) =>
      TemplateBlueprint.findOneAndUpdate(
        { slug: blueprint.slug },
        { $set: blueprint },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      ).catch((err) => console.error(`Seed error for blueprint ${blueprint.slug}:`, err))
    )
  );

  seeded = true;
}
