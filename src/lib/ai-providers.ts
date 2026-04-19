import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import { decryptString, encryptString } from "@/lib/encryption";
import { User } from "@/lib/models/User";

export const DEFAULT_GEMMA_MODEL = "google/gemma-4-26b-a4b-it";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export type AIProviderType = "openrouter" | "unsloth" | "custom_openai";

export interface AIProviderCapabilities {
  chat: boolean;
  json: boolean;
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  embeddings?: boolean;
}

export interface StoredAIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl: string;
  encryptedApiKey?: string;
  defaultModelId: string;
  allowedModelIds: string[];
  capabilities: AIProviderCapabilities;
  testReady: boolean;
  liveReady: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestStatus?: "passed" | "failed";
  lastTestMessage?: string;
}

export interface ResolvedAIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl: string;
  apiKey: string;
  defaultModelId: string;
  allowedModelIds: string[];
  capabilities: AIProviderCapabilities;
}

export interface PublicAIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl: string;
  defaultModelId: string;
  allowedModelIds: string[];
  capabilities: AIProviderCapabilities;
  testReady: boolean;
  liveReady: boolean;
  hasApiKey: boolean;
  lastTestStatus?: "passed" | "failed";
  lastTestMessage?: string;
  createdAt: string;
  updatedAt: string;
}

type UserWithProviders = {
  encryptedAiProviders?: StoredAIProvider[];
  save: () => Promise<unknown>;
};

const DEFAULT_CAPABILITIES: Record<AIProviderType, AIProviderCapabilities> = {
  openrouter: {
    chat: true,
    json: true,
    tools: true,
    vision: true,
    reasoning: true,
    embeddings: false,
  },
  unsloth: {
    chat: true,
    json: true,
    tools: false,
    vision: false,
    reasoning: false,
    embeddings: false,
  },
  custom_openai: {
    chat: true,
    json: true,
    tools: true,
    vision: false,
    reasoning: false,
    embeddings: true,
  },
};

function canUsePrivateUrls() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_PRIVATE_AI_ENDPOINTS === "true"
  );
}

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  if (lower === "0.0.0.0" || lower === "::1") return true;
  if (lower.startsWith("127.")) return true;
  if (lower.startsWith("10.")) return true;
  if (lower.startsWith("192.168.")) return true;

  const parts = lower.split(".").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part))) {
    return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
  }

  return false;
}

export function normalizeProviderBaseUrl(type: AIProviderType, value?: string) {
  const raw = type === "openrouter" ? OPENROUTER_BASE_URL : String(value || "").trim();
  if (!raw) {
    throw new Error("Provider base URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Provider base URL must be a valid URL.");
  }

  const isPrivate = isPrivateHostname(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isPrivate && canUsePrivateUrls())) {
    throw new Error("Provider base URL must use HTTPS unless private endpoints are explicitly allowed.");
  }

  if (isPrivate && !canUsePrivateUrls()) {
    throw new Error("Private provider URLs are disabled in this environment.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export function getDefaultProviderConfig(): ResolvedAIProvider {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      id: "env-openrouter",
      name: "OpenRouter",
      type: "openrouter",
      baseUrl: OPENROUTER_BASE_URL,
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModelId: process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_GEMMA_MODEL,
      allowedModelIds: [
        DEFAULT_GEMMA_MODEL,
        "google/gemma-4-31b-it",
        "google/gemma-4-26b-a4b-it:free",
        "google/gemma-4-31b-it:free",
      ],
      capabilities: DEFAULT_CAPABILITIES.openrouter,
    };
  }

  const localBaseUrl = process.env.UNSLOTH_BASE_URL || process.env.LITELLM_BASE_URL;
  if (localBaseUrl) {
    return {
      id: "env-local-openai-compatible",
      name: process.env.UNSLOTH_BASE_URL ? "Unsloth Local" : "LiteLLM Local",
      type: process.env.UNSLOTH_BASE_URL ? "unsloth" : "custom_openai",
      baseUrl: normalizeProviderBaseUrl(
        process.env.UNSLOTH_BASE_URL ? "unsloth" : "custom_openai",
        localBaseUrl
      ),
      apiKey: process.env.UNSLOTH_API_KEY || process.env.LITELLM_API_KEY || "local-not-required",
      defaultModelId:
        process.env.UNSLOTH_DEFAULT_MODEL ||
        process.env.LITELLM_DEFAULT_MODEL ||
        DEFAULT_GEMMA_MODEL,
      allowedModelIds: [],
      capabilities: process.env.UNSLOTH_BASE_URL
        ? DEFAULT_CAPABILITIES.unsloth
        : DEFAULT_CAPABILITIES.custom_openai,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      id: "env-openai",
      name: "OpenAI",
      type: "custom_openai",
      baseUrl: "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY,
      defaultModelId: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o",
      allowedModelIds: ["gpt-4o", "gpt-4.1-mini"],
      capabilities: DEFAULT_CAPABILITIES.custom_openai,
    };
  }

  throw new Error("Configure OpenRouter, Unsloth, or a custom OpenAI-compatible provider before using AI features.");
}

export function toPublicProvider(provider: StoredAIProvider): PublicAIProvider {
  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    baseUrl: provider.baseUrl,
    defaultModelId: provider.defaultModelId,
    allowedModelIds: provider.allowedModelIds || [],
    capabilities: provider.capabilities || DEFAULT_CAPABILITIES[provider.type],
    testReady: Boolean(provider.testReady),
    liveReady: Boolean(provider.liveReady),
    hasApiKey: Boolean(provider.encryptedApiKey),
    lastTestStatus: provider.lastTestStatus,
    lastTestMessage: provider.lastTestMessage,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export function buildStoredProvider(input: {
  name: string;
  type: AIProviderType;
  baseUrl?: string;
  apiKey?: string;
  defaultModelId?: string;
  allowedModelIds?: string[];
  capabilities?: Partial<AIProviderCapabilities>;
  testReady?: boolean;
  liveReady?: boolean;
}): StoredAIProvider {
  const now = new Date().toISOString();
  const type = input.type;
  const baseUrl = normalizeProviderBaseUrl(type, input.baseUrl);

  return {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    type,
    baseUrl,
    encryptedApiKey: input.apiKey ? encryptString(input.apiKey) : "",
    defaultModelId: input.defaultModelId || (type === "openrouter" ? DEFAULT_GEMMA_MODEL : ""),
    allowedModelIds: input.allowedModelIds || [],
    capabilities: {
      ...DEFAULT_CAPABILITIES[type],
      ...(input.capabilities || {}),
    },
    testReady: Boolean(input.testReady),
    liveReady: Boolean(input.liveReady),
    createdAt: now,
    updatedAt: now,
  };
}

export async function listUserProviders(userId: string): Promise<StoredAIProvider[]> {
  await dbConnect();
  const user = await User.findById(userId).lean<{ encryptedAiProviders?: StoredAIProvider[] }>();
  return (user?.encryptedAiProviders || []).filter(Boolean);
}

export async function resolveUserProvider(userId?: string, providerId?: string): Promise<ResolvedAIProvider> {
  if (!providerId) {
    return getDefaultProviderConfig();
  }

  if (!userId) {
    throw new Error("A signed-in user is required to use saved AI providers.");
  }

  const providers = await listUserProviders(userId);
  const provider = providers.find((entry) => entry.id === providerId);
  if (!provider) {
    throw new Error("Selected AI provider was not found.");
  }

  const apiKey = provider.encryptedApiKey ? decryptString(provider.encryptedApiKey) : "";
  if (!apiKey && provider.type !== "unsloth") {
    throw new Error("Selected AI provider is missing an API key.");
  }

  return {
    id: provider.id,
    name: provider.name,
    type: provider.type,
    baseUrl: provider.baseUrl,
    apiKey: apiKey || "local-not-required",
    defaultModelId: provider.defaultModelId,
    allowedModelIds: provider.allowedModelIds || [],
    capabilities: provider.capabilities || DEFAULT_CAPABILITIES[provider.type],
  };
}

export async function saveUserProvider(userId: string, provider: StoredAIProvider) {
  await dbConnect();
  await User.findByIdAndUpdate(userId, {
    $push: { encryptedAiProviders: provider },
  });
}

export async function updateUserProvider(
  userId: string,
  providerId: string,
  patch: Partial<StoredAIProvider> & { apiKey?: string }
) {
  await dbConnect();
  const user = (await User.findById(userId)) as unknown as UserWithProviders | null;
  if (!user) throw new Error("User not found.");

  const providers = (user.encryptedAiProviders || []).map((provider) => {
    if (provider.id !== providerId) return provider;
    const type = patch.type || provider.type;
    const baseUrl = patch.baseUrl
      ? normalizeProviderBaseUrl(type, patch.baseUrl)
      : provider.baseUrl;
    return {
      ...provider,
      ...patch,
      type,
      baseUrl,
      encryptedApiKey:
        patch.apiKey !== undefined ? encryptString(patch.apiKey) : provider.encryptedApiKey,
      updatedAt: new Date().toISOString(),
    };
  });

  user.encryptedAiProviders = providers;
  await user.save();
}

export async function deleteUserProvider(userId: string, providerId: string) {
  await dbConnect();
  await User.findByIdAndUpdate(userId, {
    $pull: { encryptedAiProviders: { id: providerId } },
  });
}
