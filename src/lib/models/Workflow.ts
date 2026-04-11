import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflow extends Document {
  name: string;
  description: string;
  graph: Record<string, unknown> | null;
  nodes: unknown[];
  edges: unknown[];
  viewport: Record<string, unknown>;
  creatorId: mongoose.Types.ObjectId | string;
  isPublic: boolean;
  xpValue: number;
  clones: number;
  lifecycle:
    | "draft"
    | "simulated"
    | "benchmarked"
    | "published"
    | "archived"
    | "soft_deleted";
  graphVersion: string;
  sourceBlueprintSlug?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: Date | null;
  lastSavedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    graph: { type: Schema.Types.Mixed, default: null },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    viewport: { type: Schema.Types.Mixed, default: { x: 0, y: 0, zoom: 1 } },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: false },
    xpValue: { type: Number, default: 0 },
    clones: { type: Number, default: 0 },
    lifecycle: {
      type: String,
      enum: ["draft", "simulated", "benchmarked", "published", "archived", "soft_deleted"],
      default: "draft",
    },
    graphVersion: { type: String, default: "1.0" },
    sourceBlueprintSlug: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    deletedAt: { type: Date, default: null },
    lastSavedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Workflow = mongoose.models.Workflow || mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
