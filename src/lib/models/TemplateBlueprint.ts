import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITemplateBlueprint extends Document {
  slug: string;
  name: string;
  description: string;
  sector: string;
  useCase: string;
  maturity: "starter" | "production";
  tags: string[];
  requiredConnectors: string[];
  configurableParameters: string[];
  analysisRubric: string[];
  benchmarkRubric: string[];
  estimatedCreditCost: number;
  defaultScenario: Record<string, unknown>;
  graph: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateBlueprintSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    sector: { type: String, required: true, index: true },
    useCase: { type: String, required: true },
    maturity: {
      type: String,
      enum: ["starter", "production"],
      default: "production",
    },
    tags: { type: [String], default: [] },
    requiredConnectors: { type: [String], default: [] },
    configurableParameters: { type: [String], default: [] },
    analysisRubric: { type: [String], default: [] },
    benchmarkRubric: { type: [String], default: [] },
    estimatedCreditCost: { type: Number, default: 1 },
    defaultScenario: { type: Schema.Types.Mixed, default: {} },
    graph: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const TemplateBlueprint: Model<ITemplateBlueprint> =
  mongoose.models.TemplateBlueprint ||
  mongoose.model<ITemplateBlueprint>("TemplateBlueprint", TemplateBlueprintSchema);
