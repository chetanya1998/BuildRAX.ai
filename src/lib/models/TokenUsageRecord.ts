import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITokenUsageRecord extends Document {
  userId: string;
  workflowId?: string;
  runType: "test" | "execution" | "benchmark" | "prompt_compile" | "audit";
  runId?: string;
  providerModel?: string;
  tokenUsage: number;
  cost: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const TokenUsageRecordSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    workflowId: { type: String, default: "" },
    runType: {
      type: String,
      enum: ["test", "execution", "benchmark", "prompt_compile", "audit"],
      required: true,
    },
    runId: { type: String, default: "" },
    providerModel: { type: String, default: "" },
    tokenUsage: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const TokenUsageRecord: Model<ITokenUsageRecord> =
  mongoose.models.TokenUsageRecord ||
  mongoose.model<ITokenUsageRecord>("TokenUsageRecord", TokenUsageRecordSchema);
