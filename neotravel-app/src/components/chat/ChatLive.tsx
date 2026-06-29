"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

const EXAMPLE =
  "Bonjour, je souhaite un devis pour 35 personnes de Paris à Lyon le 15/07/2026, environ 460 km. Email : contact@monentreprise.fr";

type LlmStatus = {
  provider: "ollama" | "openai" | "none";
  label: string;
};

export function ChatLive({ defaultDemo = false }: { defaultDemo?: boolean }) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [llmStatus, setLlmStatus] = useState<LlmStatus | null>(null);
  const [demoMode, setDemoMode] = useState(defaultDemo);
  const [showRescueMode, setShowRescueMode] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const api = demoMode ? "/api/chat/demo" : "/api/chat";

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api, body: { sessionId } }),
  });

  useEffect(() => {
    if (defaultDemo) return;
    fetch("/api/llm/status")
      .then((r) => r.json())
      .then((s: LlmStatus) => {
        setLlmStatus(s);
        if (s.provider === "none") setDemoMode(true);
      })
      .catch(() => setDemoMode(true));
  }, [defaultDemo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = (textareaRef.current?.value ?? "").trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    if (textareaRef.current) textareaRef.current.value = "";
  };

  const providerLabel = demoMode
    ? "Mode secours (sans LLM — pipeline métier actif)"
    : (llmStatus?.label ?? "Connexion au fournisseur IA…");

  const providerKind = demoMode ? "none" : (llmStatus?.provider ?? "loading");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wizard)]">
              Option A — Assistant conversationnel
            </p>
            <h1 className="text-xl font-bold text-[var(--color-brand)]">Chat devis</h1>
          </div>
          <Link
            href="/devis"
            className="text-sm font-medium text-slate-500 underline hover:text-[var(--color-brand)]"
          >
            Option B : formulaire guidé
          </Link>
        </div>

        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            providerKind === "none"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : providerKind === "loading"
                ? "border-slate-200 bg-slate-50 text-slate-600"
                : "border-violet-200 bg-violet-50 text-violet-900"
          }`}
          data-testid="llm-provider-badge"
        >
          <span className="font-semibold">Fournisseur actif :</span> {providerLabel}
          {providerKind === "ollama" && (
            <span className="ml-2 text-xs text-violet-700">(Ollama local)</span>
          )}
          {providerKind === "openai" && (
            <span className="ml-2 text-xs text-violet-700">(OpenAI cloud)</span>
          )}
        </div>

        <div className="mt-6 min-h-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {messages.length === 0 && (
            <div className="text-sm text-slate-600">
              <p>Décrivez votre trajet en un message — l&apos;assistant collecte les informations.</p>
              <button
                type="button"
                onClick={() => {
                  if (textareaRef.current) textareaRef.current.value = EXAMPLE;
                }}
                className="mt-3 rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Insérer un exemple
              </button>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              data-testid={m.role === "assistant" ? "assistant-message" : "user-message"}
              className={`mb-4 text-sm ${m.role === "user" ? "text-right" : ""}`}
            >
              <span className="text-xs text-slate-400">
                {m.role === "user" ? "Vous" : "Assistant"}
              </span>
              <div
                className={`mt-1 rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "ml-8 bg-[var(--color-brand)]/10 text-slate-800"
                    : "mr-8 bg-slate-100 text-slate-800"
                }`}
              >
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <p key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}

        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            ref={textareaRef}
            data-testid="chat-input"
            placeholder="Votre message…"
            rows={3}
            disabled={status === "streaming"}
            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-[var(--color-wizard)] focus:ring-2 focus:ring-violet-100"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-sm text-slate-500 underline hover:text-[var(--color-brand)]">
              Retour à l&apos;accueil
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRescueMode((v) => !v)}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Options avancées
              </button>
              <button
                type="submit"
                data-testid="chat-send"
                disabled={status === "streaming"}
                className="rounded-lg bg-[var(--color-wizard)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {status === "streaming" ? "Envoi…" : "Envoyer"}
              </button>
            </div>
          </div>
          {showRescueMode && (
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
              />
              Mode secours sans IA (pipeline métier uniquement)
            </label>
          )}
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
