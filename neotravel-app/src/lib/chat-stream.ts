import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";

export function streamTextReply(writer: UIMessageStreamWriter<UIMessage>, text: string) {
  const id = "direct-text";
  writer.write({ type: "text-start", id });
  for (const w of text.split(/(\s+)/)) {
    writer.write({ type: "text-delta", id, delta: w });
  }
  writer.write({ type: "text-end", id });
}

export function directChatResponse(messages: UIMessage[], text: string) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      streamTextReply(writer, text);
    },
  });
  return createUIMessageStreamResponse({ stream });
}
