import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITemplate extends Document {
  name: string;
  category: string;
  description?: string;
  nodes: any;
  edges: any;
  isPublic: boolean;
  clones: number;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    nodes: { type: Schema.Types.Mixed, default: [] },
    edges: { type: Schema.Types.Mixed, default: [] },
    isPublic: { type: Boolean, default: false },
    clones: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
