import mongoose, { Schema, Document } from "mongoose";

export interface ILessonProgress extends Document {
  userId: mongoose.Types.ObjectId | string;
  currentModuleId: string;
  completedModules: string[];
  lastActiveAt: Date;
}

const LessonProgressSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentModuleId: { type: String, default: "intro-nodes" },
    completedModules: { type: [String], default: [] },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LessonProgress = mongoose.models.LessonProgress || mongoose.model<ILessonProgress>("LessonProgress", LessonProgressSchema);
