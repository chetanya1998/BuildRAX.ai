import mongoose, { Schema, Document, Model } from "mongoose";

export enum ExecutionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IExecution extends Document {
  workflowId: mongoose.Types.ObjectId;
  status: ExecutionStatus;
  logs?: any;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionSchema: Schema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    status: {
      type: String,
      enum: Object.values(ExecutionStatus),
      default: ExecutionStatus.PENDING,
    },
    logs: { type: Schema.Types.Mixed, default: [] },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Execution: Model<IExecution> =
  mongoose.models.Execution || mongoose.model<IExecution>("Execution", ExecutionSchema);
