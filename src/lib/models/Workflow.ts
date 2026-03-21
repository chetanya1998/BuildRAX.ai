import mongoose, { Schema, Document } from "mongoose";

export interface IWorkflow extends Document {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  viewport: any;
  creatorId: mongoose.Types.ObjectId | string;
  isPublic: boolean;
  xpValue: number;
  clones: number;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    viewport: { type: Schema.Types.Mixed, default: { x: 0, y: 0, zoom: 1 } },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublic: { type: Boolean, default: false },
    xpValue: { type: Number, default: 0 },
    clones: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Workflow = mongoose.models.Workflow || mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
