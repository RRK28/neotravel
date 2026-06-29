"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import {
  buildReply,
  champsManquants,
  mergeDemande,
  parseMessage,
  type ParsedDemande,
} from "@/lib/chat-demo";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const EXAMPLE =
  "Bonjour, nous sommes 45 lycéens pour un voyage Paris → Versailles le 12 mars. Email : contact@lycee.fr";

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [demande, setDemande] = useState<ParsedDemande>({});
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const parsed = parseMessage(trimmed);
    const merged = mergeDemande(demande, parsed);
    const missing = champsManquants(merged);
    const reply = buildReply(merged, missing);

    setDemande(merged);
    setMessages((m) => [
      ...m,
      { role: "user", text: trimmed },
      { role: "assistant", text: reply },
    ]);
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="text-xl font-bold text-[var(--color-brand)]">Parler à un conseiller</h1>
        <p className="mt-1 text-sm text-slate-600">
          Décrivez votre trajet et recevez une estimation personnalisée.
        </p>

        <div className="mt-6 min-h-[300px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {messages.length === 0 && (
            <p className="text-sm text-slate-600">
              Indiquez villes, date, nombre de passagers et votre e-mail de contact.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`mb-4 text-sm ${m.role === "user" ? "text-right" : ""}`}>
              <span className="text-xs text-slate-400">
                {m.role === "user" ? "Vous" : "Conseiller NeoTravel"}
              </span>
              <p
                className={`mt-1 whitespace-pre-wrap rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "ml-8 bg-[var(--color-brand)]/10 text-slate-800"
                    : "mr-8 bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex. : 35 passagers, Paris → Lyon, le 15 juillet, contact@entreprise.fr"
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-[var(--color-wizard)] focus:ring-2 focus:ring-violet-100"
          />
          <div className="mt-2 flex justify-between">
            <Link href="/" className="text-sm text-slate-500 underline hover:text-[var(--color-brand)]">
              Retour à l&apos;accueil
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => send(EXAMPLE)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Exemple
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-wizard)] px-4 py-1.5 text-sm font-semibold text-white"
              >
                Envoyer
              </button>
            </div>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
