import mongoose, { Schema, Document } from "mongoose";

export interface IAgent extends Document {
  name: string;
  description: string;
  creatorId: mongoose.Types.ObjectId | string;
  systemPrompt: string;
  modelProviderId?: string;
  modelId: string;
  capabilities: string[];
  memoryEnabled: boolean;
  maxIter: number;
  tools: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    systemPrompt: { type: String, default: "You are a helpful AI assistant." },
    modelProviderId: { type: String },
    modelId: { type: String, default: "google/gemma-4-26b-a4b-it" },
    capabilities: { type: [String], default: ["chat", "tools"] },
    memoryEnabled: { type: Boolean, default: true },
    maxIter: { type: Number, default: 5 },
    tools: { type: Schema.Types.Mixed, default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Agent = mongoose.models.Agent || mongoose.model<IAgent>("Agent", AgentSchema);
