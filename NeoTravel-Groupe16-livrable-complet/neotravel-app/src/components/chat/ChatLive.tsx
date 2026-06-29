"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

const EXAMPLES = [
  "Bonjour, nous sommes 45 lycéens pour un voyage Paris → Versailles le 12 mars. Pouvez-vous me faire un devis ?",
  "Besoin d'un autocar pour un séminaire d'entreprise : Lyon → Annecy, 28 personnes, aller-retour le 20 juin.",
  "Mariage à Bordeaux, 80 invités à transférer depuis la gare vers le domaine. Date : 5 septembre.",
];

export function ChatLive({ defaultDemo = false }: { defaultDemo?: boolean }) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [demoMode, setDemoMode] = useState(defaultDemo);
  const [showSettings, setShowSettings] = useState(false);
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
      .then((s: { provider: string }) => {
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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-wizard)]">
              Devis en ligne
            </p>
            <h1 className="text-xl font-bold text-[var(--color-brand)]">Parler à un conseiller</h1>
            <p className="mt-1 text-sm text-slate-600">
              Décrivez votre trajet : un conseiller NeoTravel prépare votre devis en quelques minutes.
            </p>
          </div>
          <Link
            href="/devis"
            className="text-sm font-medium text-slate-500 underline hover:text-[var(--color-brand)]"
          >
            Formulaire détaillé →
          </Link>
        </div>

        <div className="mt-6 min-h-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {messages.length === 0 && (
            <div className="text-sm text-slate-600">
              <p>
                Indiquez le nombre de passagers, les villes de départ et d&apos;arrivée, la date
                souhaitée et votre e-mail. Nous nous occupons du reste.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (textareaRef.current) textareaRef.current.value = ex;
                    }}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {ex.length > 60 ? `${ex.slice(0, 57)}…` : ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              data-testid={m.role === "assistant" ? "assistant-message" : "user-message"}
              className={`mb-4 text-sm ${m.role === "user" ? "text-right" : ""}`}
            >
              <span className="text-xs text-slate-400">
                {m.role === "user" ? "Vous" : "Conseiller NeoTravel"}
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
            placeholder="Ex. : 35 passagers, Paris → Lyon, le 15 juillet, contact@entreprise.fr"
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
                onClick={() => setShowSettings((v) => !v)}
                className="text-xs text-slate-400 underline hover:text-slate-600"
              >
                Paramètres
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
          {showSettings && (
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
                Réponse guidée (hors ligne)
              </label>
            </div>
          )}
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
