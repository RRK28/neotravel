import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { createAgentTools } from "@/lib/agent/tools";
import { directChatResponse } from "@/lib/chat-stream";
import { extractAllUserText, extractLastUserText, processDemandePipeline } from "@/lib/demande-ingest";
import { logAction } from "@/lib/db/memory-store";
import { createLanguageModel, resolveLlmProvider } from "@/lib/llm/provider";

export const maxDuration = 60;

const sessionDemandeIds = new Map<string, { current: string | null }>();

export async function POST(req: Request) {
  const { messages, sessionId = "default" }: { messages: UIMessage[]; sessionId?: string } =
    await req.json();

  const provider = await resolveLlmProvider();
  const model = createLanguageModel(provider);

  if (!model) {
    return Response.json(
      {
        error: `Aucun LLM disponible (${provider.label}). Démarrez Ollama (ollama serve) ou configurez OPENAI_API_KEY. Mode démo : /api/chat/demo`,
        provider: provider.kind,
        fallback: "/api/chat/demo",
      },
      { status: 503 },
    );
  }

  if (!sessionDemandeIds.has(sessionId)) {
    sessionDemandeIds.set(sessionId, { current: null });
  }
  const sessionRef = sessionDemandeIds.get(sessionId)!;
  const tools = createAgentTools(sessionRef);

  const allUserText = extractAllUserText(messages);
  const lastUserText = extractLastUserText(messages);
  const baseUrl = new URL(req.url).origin;
  const pipeline = await processDemandePipeline(sessionRef, allUserText, {
    baseUrl,
    lastUserText,
  });

  if (pipeline.directReply) {
    return directChatResponse(messages, pipeline.directReply);
  }

  const system = `${SYSTEM_PROMPT}\n\nRÉSULTAT BACK-OFFICE :\n${pipeline.replyHint}`;

  const ollamaMaxTokens = parseInt(process.env.OLLAMA_MAX_TOKENS ?? "512", 10);

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
    tools,
    temperature: provider.kind === "ollama" ? 0 : undefined,
    maxOutputTokens: provider.kind === "ollama" ? ollamaMaxTokens : undefined,
    stopWhen: stepCountIs(8),
    onFinish: async ({ usage }) => {
      await logAction(
        "agent_response",
        { sessionId, provider: provider.kind, model: provider.modelId },
        sessionRef.current ?? undefined,
        usage?.totalTokens,
      );
    },
  });

  return result.toUIMessageStreamResponse();
}
