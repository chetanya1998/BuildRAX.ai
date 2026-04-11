import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICreditLedgerEntry extends Document {
  userId: string;
  direction: "credit" | "debit";
  action: string;
  amount: number;
  referenceType: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CreditLedgerEntrySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    action: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    referenceType: { type: String, required: true },
    referenceId: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const CreditLedgerEntry: Model<ICreditLedgerEntry> =
  mongoose.models.CreditLedgerEntry ||
  mongoose.model<ICreditLedgerEntry>("CreditLedgerEntry", CreditLedgerEntrySchema);
