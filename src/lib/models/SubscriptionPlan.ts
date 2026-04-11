import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubscriptionPlan extends Document {
  userId: string;
  tier: "free" | "pro_20" | "growth_40" | "enterprise";
  monthlyCredits: number;
  status: "active" | "canceled" | "past_due" | "trialing";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    tier: {
      type: String,
      enum: ["free", "pro_20", "growth_40", "enterprise"],
      default: "free",
    },
    monthlyCredits: { type: Number, default: 25 },
    status: {
      type: String,
      enum: ["active", "canceled", "past_due", "trialing"],
      default: "active",
    },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ||
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
