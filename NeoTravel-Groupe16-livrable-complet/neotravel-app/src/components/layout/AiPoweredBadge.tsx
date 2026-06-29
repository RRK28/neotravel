export function AiPoweredBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ${className}`}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
      Devis en ligne
    </span>
  );
}
