import OpenAI from 'openai';

// This acts as a wrapper for LiteLLM, Ollama, or OpenAI directly.
// By default, if LITELLM_BASE_URL is provided, we route through that proxy.
// Otherwise, we fallback to direct OpenAI.

const getClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.LITELLM_API_KEY || "dummy",
    baseURL: process.env.LITELLM_BASE_URL || "https://api.openai.com/v1",
  });
};

export interface AIOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "text" | "json_object" };
}

export const generateText = async (prompt: string, systemPrompt?: string, options: AIOptions = {}) => {
  const client = getClient();
  
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await client.chat.completions.create({
      model: options.model || "gpt-3.5-turbo",
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens,
      response_format: options.response_format,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate response from AI model.");
  }
};
