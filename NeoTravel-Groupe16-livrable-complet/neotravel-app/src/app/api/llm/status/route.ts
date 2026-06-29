import { NextResponse } from "next/server";
import { resolveLlmProvider } from "@/lib/llm/provider";

export async function GET() {
  const provider = await resolveLlmProvider();
  return NextResponse.json({
    provider: provider.kind,
    model: provider.modelId || null,
    label: provider.label,
    ollama_base_url: provider.ollamaBaseUrl ?? null,
    chat_endpoint: provider.kind === "none" ? "/api/chat/demo" : "/api/chat",
    hints:
      provider.kind === "none"
        ? [
            "Démarrez Ollama : ollama serve",
            "Ou configurez OPENAI_API_KEY",
            "Ou utilisez le mode démo (coché automatiquement)",
          ]
        : provider.kind === "ollama"
          ? ["LLM local via Ollama — aucune clé API requise"]
          : ["LLM cloud via OpenAI"],
  });
}
