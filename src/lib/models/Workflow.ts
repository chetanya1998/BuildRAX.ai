import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  nodes: any;
  edges: any;
  userId: mongoose.Types.ObjectId;
  executions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    executions: [{ type: Schema.Types.ObjectId, ref: "Execution" }],
  },
  { timestamps: true }
);

export const Workflow: Model<IWorkflow> =
  mongoose.models.Workflow || mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
