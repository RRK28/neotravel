import { resolveLlmProvider } from "@/lib/llm/provider";

export async function AiPoweredBadge({ className = "" }: { className?: string }) {
  const llm = await resolveLlmProvider();

  if (llm.kind === "none") return null;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-violet-300/40 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100 ${className}`}
      title={llm.label}
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
      Assistant conversationnel
      <span className="font-normal text-violet-200/90">· {llm.label}</span>
    </span>
  );
}
