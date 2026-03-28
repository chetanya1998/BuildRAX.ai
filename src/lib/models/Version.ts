import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVersion extends Document {
  workflowId: mongoose.Types.ObjectId;
  name: string;
  nodes: any;
  edges: any;
  benchmarks: {
    latency: number;
    tokens: number;
    cost: number;
    successRate: number;
  };
  createdAt: Date;
}

const VersionSchema: Schema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    name: { type: String, default: "Initial Version" },
    nodes: { type: Schema.Types.Mixed, required: true },
    edges: { type: Schema.Types.Mixed, required: true },
    benchmarks: {
      latency: { type: Number, default: 0 },
      tokens: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
      successRate: { type: Number, default: 100 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Version: Model<IVersion> =
  mongoose.models.Version || mongoose.model<IVersion>("Version", VersionSchema);
