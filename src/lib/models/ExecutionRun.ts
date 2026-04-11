import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExecutionRun extends Document {
  workflowId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  scenario: unknown;
  graph: unknown;
  analysis: unknown;
  nodeResults: unknown[];
  summary: unknown;
  status: "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionRunSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scenario: { type: Schema.Types.Mixed, default: {} },
    graph: { type: Schema.Types.Mixed, required: true },
    analysis: { type: Schema.Types.Mixed, default: {} },
    nodeResults: { type: [Schema.Types.Mixed], default: [] },
    summary: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["completed", "failed"], default: "completed" },
  },
  { timestamps: true }
);

export const ExecutionRun: Model<IExecutionRun> =
  mongoose.models.ExecutionRun ||
  mongoose.model<IExecutionRun>("ExecutionRun", ExecutionRunSchema);
