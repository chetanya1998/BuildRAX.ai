import mongoose, { Schema, Document } from "mongoose";

export interface IGuestRateLimit extends Document {
  identifier: string; // IP address or Session ID
  count: number;
  lastResetAt: Date;
}

const GuestRateLimitSchema: Schema = new Schema({
  identifier: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  lastResetAt: { type: Date, default: Date.now },
});

export const GuestRateLimit =
  mongoose.models.GuestRateLimit ||
  mongoose.model<IGuestRateLimit>("GuestRateLimit", GuestRateLimitSchema);
