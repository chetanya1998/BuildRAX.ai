import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  AIProviderType,
  buildStoredProvider,
  getDefaultProviderConfig,
  listUserProviders,
  saveUserProvider,
  toPublicProvider,
} from "@/lib/ai-providers";

type SessionUser = { id?: string };

const PROVIDER_TYPES: AIProviderType[] = ["openrouter", "unsloth", "custom_openai"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to manage AI providers." }, { status: 401 });
    }

    const userId = String((session.user as SessionUser).id || "");
    const providers = await listUserProviders(userId);
    let serverDefaultProvider = null;
    try {
      const provider = getDefaultProviderConfig();
      serverDefaultProvider = {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        baseUrl: provider.baseUrl,
        defaultModelId: provider.defaultModelId,
        allowedModelIds: provider.allowedModelIds,
        capabilities: provider.capabilities,
        testReady: true,
        liveReady: true,
        hasApiKey: true,
      };
    } catch {
      serverDefaultProvider = null;
    }

    return NextResponse.json({
      providers: providers.map(toPublicProvider),
      serverDefaultProvider,
    });
  } catch (error) {
    console.error("AI provider list error:", error);
    const message = error instanceof Error ? error.message : "Failed to list providers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sign in to add AI providers." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type as AIProviderType;
    if (!PROVIDER_TYPES.includes(type)) {
      return NextResponse.json({ error: "Unsupported provider type." }, { status: 400 });
    }

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: "Provider name is required." }, { status: 400 });
    }

    const provider = buildStoredProvider({
      name: String(body.name),
      type,
      baseUrl: body.baseUrl,
      apiKey: body.apiKey,
      defaultModelId: body.defaultModelId,
      allowedModelIds: Array.isArray(body.allowedModelIds) ? body.allowedModelIds : [],
      capabilities: body.capabilities,
      testReady: body.testReady,
      liveReady: body.liveReady,
    });

    const userId = String((session.user as SessionUser).id || "");
    await saveUserProvider(userId, provider);

    return NextResponse.json({ provider: toPublicProvider(provider) }, { status: 201 });
  } catch (error) {
    console.error("AI provider create error:", error);
    const message = error instanceof Error ? error.message : "Failed to create provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
