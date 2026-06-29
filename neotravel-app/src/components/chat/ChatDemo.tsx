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
  "Bonjour, je souhaite un devis pour 35 personnes de Paris à Lyon le 15/07/2026, environ 460 km. Email : contact@monentreprise.fr";

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
        <h1 className="text-xl font-bold">Chat devis</h1>
        <p className="mt-1 text-sm text-gray-500">Version test — logique simplifiée, pas encore branchée à l&apos;agent final</p>

        <div className="mt-6 min-h-[300px] rounded border border-gray-300 bg-white p-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-600">
              Décrivez votre trajet (villes, date, passagers, km, email).
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`mb-4 text-sm ${m.role === "user" ? "text-right" : ""}`}>
              <span className="text-xs text-gray-400">{m.role === "user" ? "vous" : "assistant"}</span>
              <p className={`mt-1 whitespace-pre-wrap rounded px-3 py-2 ${m.role === "user" ? "ml-8 bg-blue-100" : "mr-8 bg-gray-100"}`}>
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
            placeholder="Votre message..."
            rows={3}
            className="w-full rounded border border-gray-300 p-3 text-sm"
          />
          <div className="mt-2 flex justify-between">
            <Link href="/" className="text-sm text-gray-500 underline">
              retour
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => send(EXAMPLE)}
                className="rounded border border-gray-400 px-3 py-1 text-sm"
              >
                exemple
              </button>
              <button type="submit" className="rounded bg-gray-800 px-4 py-1 text-sm text-white">
                envoyer
              </button>
            </div>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
