import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBenchmarkRun extends Document {
  workflowId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  dataset?: string;
  scoringConfig: unknown;
  variants: unknown[];
  scores: unknown[];
  winnerVariantId?: string;
  confidence?: number;
  summary: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const BenchmarkRunSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dataset: { type: String, default: "" },
    scoringConfig: { type: Schema.Types.Mixed, default: {} },
    variants: { type: [Schema.Types.Mixed], default: [] },
    scores: { type: [Schema.Types.Mixed], default: [] },
    winnerVariantId: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    summary: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const BenchmarkRun: Model<IBenchmarkRun> =
  mongoose.models.BenchmarkRun ||
  mongoose.model<IBenchmarkRun>("BenchmarkRun", BenchmarkRunSchema);
