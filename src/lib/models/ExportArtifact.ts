import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExportArtifact extends Document {
  workflowId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  type: string;
  contentSnapshot: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExportArtifactSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    contentSnapshot: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ExportArtifact: Model<IExportArtifact> =
  mongoose.models.ExportArtifact || mongoose.model<IExportArtifact>("ExportArtifact", ExportArtifactSchema);
