import mongoose, { Schema, Document } from "mongoose";

export interface IExecution extends Document {
  workflowId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: "running" | "completed" | "failed" | "blocked";
  results: {
    nodeId: string;
    output: unknown;
    executionTimeMs: number;
    error?: string;
  }[];
  startedAt: Date;
  completedAt?: Date;
}

const ExecutionSchema: Schema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["running", "completed", "failed", "blocked"], default: "running" },
    results: { type: Schema.Types.Mixed, default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Execution = mongoose.models.Execution || mongoose.model<IExecution>("Execution", ExecutionSchema);
