import mongoose, { Schema, Document } from "mongoose";

export interface IMission extends Document {
  title: string;
  description: string;
  xpReward: number;
  levelRequired: number;
  prerequisites: mongoose.Types.ObjectId[];
  steps: {
    title: string;
    description: string;
    type: "BUILD" | "EXECUTE" | "WATCH";
    targetId?: string; // e.g., a specific template ID to clone or node type to use
  }[];
  badge?: string;
  order: number;
  isActive: boolean;
}

const MissionSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    xpReward: { type: Number, default: 0 },
    levelRequired: { type: Number, default: 1 },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Mission" }],
    steps: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        type: { type: String, enum: ["BUILD", "EXECUTE", "WATCH"], required: true },
        targetId: { type: String },
      },
    ],
    badge: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Mission = mongoose.models.Mission || mongoose.model<IMission>("Mission", MissionSchema);
