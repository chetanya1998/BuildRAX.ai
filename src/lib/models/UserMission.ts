import mongoose, { Schema, Document } from "mongoose";

export interface IUserMission extends Document {
  userId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  status: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
  completedSteps: number[]; // Array of step indices completed
  completedAt?: Date;
}

const UserMissionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
    status: {
      type: String,
      enum: ["LOCKED", "AVAILABLE", "IN_PROGRESS", "COMPLETED"],
      default: "LOCKED",
    },
    completedSteps: { type: [Number], default: [] },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Ensure unique combination of user and mission
UserMissionSchema.index({ userId: 1, missionId: 1 }, { unique: true });

export const UserMission = mongoose.models.UserMission || mongoose.model<IUserMission>("UserMission", UserMissionSchema);
