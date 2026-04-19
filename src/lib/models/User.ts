import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image: string;
  xp: number;
  level: number;
  badges: string[];
  streak: number;
  lastActive: Date;
  encryptedApiKeys?: {
    openai?: string;
    anthropic?: string;
  };
  encryptedAiProviders?: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: { type: [String], default: [] },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    encryptedApiKeys: {
      openai: { type: String, default: "" },
      anthropic: { type: String, default: "" },
    },
    encryptedAiProviders: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
