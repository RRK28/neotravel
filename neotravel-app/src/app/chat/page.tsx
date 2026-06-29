import { ChatLive } from "@/components/chat/ChatLive";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const params = await searchParams;
  const defaultDemo =
    params.demo === "1" || process.env.NEXT_PUBLIC_FORCE_DEMO === "true";

  return <ChatLive key={defaultDemo ? "demo" : "live"} defaultDemo={defaultDemo} />;
}
