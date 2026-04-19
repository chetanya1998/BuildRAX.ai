import OpenAI from "openai";
import {
  DEFAULT_GEMMA_MODEL,
  ResolvedAIProvider,
  resolveUserProvider,
} from "@/lib/ai-providers";

export interface AIOptions {
  model?: string;
  modelId?: string;
  providerId?: string;
  userId?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "text" | "json_object" };
  apiKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
  providerId: string;
}

export interface AITextResult {
  text: string;
  usage: AIUsage;
}

function buildClient(provider: ResolvedAIProvider, options: AIOptions = {}) {
  const defaultHeaders: Record<string, string> = {
    ...(options.headers || {}),
  };

  if (provider.type === "openrouter") {
    defaultHeaders["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "https://buildrax.ai";
    defaultHeaders["X-OpenRouter-Title"] = "BuildRAX.ai";
  }

  return new OpenAI({
    apiKey: options.apiKey || provider.apiKey,
    baseURL: options.baseURL || provider.baseUrl,
    defaultHeaders,
  });
}

async function resolveProvider(options: AIOptions) {
  if (options.apiKey || options.baseURL) {
    const provider = await resolveUserProvider(options.userId, options.providerId);
    return {
      ...provider,
      apiKey: options.apiKey || provider.apiKey,
      baseUrl: options.baseURL || provider.baseUrl,
    };
  }

  return resolveUserProvider(options.userId, options.providerId);
}

function estimateCost(totalTokens: number) {
  return Number((totalTokens * 0.000001).toFixed(6));
}

export async function generateTextResult(
  prompt: string,
  systemPrompt?: string,
  options: AIOptions = {}
): Promise<AITextResult> {
  const provider = await resolveProvider(options);
  const client = buildClient(provider, options);
  const model = options.modelId || options.model || provider.defaultModelId || DEFAULT_GEMMA_MODEL;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.max_tokens,
    response_format: options.response_format,
  });

  const text = response.choices[0]?.message?.content || "";
  const totalTokens = response.usage?.total_tokens || Math.max(1, Math.ceil((prompt.length + text.length) / 4));
  const promptTokens = response.usage?.prompt_tokens || Math.max(1, Math.ceil(prompt.length / 4));
  const completionTokens = response.usage?.completion_tokens || Math.max(0, totalTokens - promptTokens);

  return {
    text,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: estimateCost(totalTokens),
      model,
      providerId: provider.id,
    },
  };
}

export async function generateText(prompt: string, systemPrompt?: string, options: AIOptions = {}) {
  const result = await generateTextResult(prompt, systemPrompt, options);
  return result.text;
}

export async function generateEmbedding(input: string, options: AIOptions = {}) {
  const provider = await resolveProvider(options);
  const client = buildClient(provider, options);
  const model = options.modelId || options.model || "text-embedding-3-small";

  if (!provider.capabilities.embeddings && provider.type === "openrouter") {
    throw new Error("Selected provider does not advertise embedding support. Configure an embedding-capable provider.");
  }

  const response = await client.embeddings.create({
    model,
    input,
  });

  return {
    vector: response.data[0]?.embedding || [],
    usage: {
      promptTokens: response.usage?.prompt_tokens || Math.max(1, Math.ceil(input.length / 4)),
      completionTokens: 0,
      totalTokens: response.usage?.total_tokens || Math.max(1, Math.ceil(input.length / 4)),
      estimatedCost: estimateCost(response.usage?.total_tokens || Math.max(1, Math.ceil(input.length / 4))),
      model,
      providerId: provider.id,
    },
  };
}

export async function testAIProvider(options: AIOptions = {}) {
  const result = await generateTextResult(
    "Return exactly: BuildRAX provider test passed",
    "You are a provider health check. Keep the answer short.",
    {
      ...options,
      max_tokens: 24,
      temperature: 0,
    }
  );

  return result;
}
