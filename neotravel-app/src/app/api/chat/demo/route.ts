import { type UIMessage } from "ai";
import { directChatResponse } from "@/lib/chat-stream";
import { extractAllUserText, processDemandePipeline } from "@/lib/demande-ingest";

const sessions = new Map<string, { current: string | null }>();

export async function POST(req: Request) {
  const { messages, sessionId = "demo" }: { messages: UIMessage[]; sessionId?: string } =
    await req.json();

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { current: null });
  }
  const sessionRef = sessions.get(sessionId)!;

  const allUserText = extractAllUserText(messages);
  const baseUrl = new URL(req.url).origin;
  const pipeline = await processDemandePipeline(sessionRef, allUserText, { baseUrl });

  const text =
    pipeline.directReply ??
    pipeline.replyHint ??
    "Décrivez votre trajet : départ, arrivée, date, passagers et email.";

  return directChatResponse(messages, text);
}
