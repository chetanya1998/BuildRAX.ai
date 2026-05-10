import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReviewRun extends Document {
  workflowId?: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  graph: unknown;
  result: unknown;
  status: "passed" | "needs_attention" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const ReviewRunSchema = new Schema(
  {
    workflowId: { type: Schema.Types.ObjectId, ref: "Workflow", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    graph: { type: Schema.Types.Mixed, required: true },
    result: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["passed", "needs_attention", "blocked"], default: "needs_attention" },
  },
  { timestamps: true }
);

export const ReviewRun: Model<IReviewRun> =
  mongoose.models.ReviewRun || mongoose.model<IReviewRun>("ReviewRun", ReviewRunSchema);
