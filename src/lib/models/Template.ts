import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRating {
  userId: string;
  score: number;
}

export interface ITemplate extends Document {
  name: string;
  category: string;
  description?: string;
  nodes: any;
  edges: any;
  isPublic: boolean;
  clones: number;
  ratings: IRating[];
  averageRating: number;
  reviews: string[];
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
    ratings: [
      {
        userId: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    averageRating: { type: Number, default: 0 },
    reviews: [{ type: String }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
