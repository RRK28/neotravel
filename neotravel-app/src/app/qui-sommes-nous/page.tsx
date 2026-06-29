import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Qui sommes-nous — NeoTravel",
  description: "Équipe et projet NeoTravel — Groupe 16, Epitech 2026",
};

const objectifs = [
  "Qualifier automatiquement les demandes de transport (trajet, passagers, date, contact).",
  "Calculer un devis TTC à partir de matrices tarifaires métier.",
  "Générer un PDF de devis et notifier le client par e-mail.",
  "Relancer les prospects et fournir un tableau de bord admin.",
];

const stack = [
  "Next.js & React",
  "Agent IA — Option A (Ollama / OpenAI)",
  "Formulaire guidé — Option B",
  "Moteur calculer_devis (déterministe)",
  "Stockage fichier JSON / Airtable",
  "Envoi d'e-mails (SMTP)",
  "Tests E2E Playwright",
];

export default function QuiSommesNousPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main>
        <section className="bg-[var(--color-brand)] text-white">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h1 className="text-3xl font-bold sm:text-4xl">Qui sommes-nous ?</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">
              Découvrez l&apos;équipe et le projet derrière la plateforme NeoTravel.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-brand)]">Le projet</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  NeoTravel simule la chaîne commerciale d&apos;une plateforme de location
                  d&apos;autocars avec chauffeur. Notre architecture repose sur deux parcours
                  complémentaires :
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                  <li>
                    <strong className="text-[var(--color-brand)]">Option A</strong> — agent
                    conversationnel (chat IA) qui collecte le besoin en langage naturel ;
                  </li>
                  <li>
                    <strong className="text-[var(--color-brand)]">Option B</strong> — formulaire
                    guidé en 3 étapes pour les utilisateurs qui préfèrent un parcours structuré.
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Dans les deux cas, le prix est calculé par un{" "}
                  <strong>moteur déterministe</strong> (<code>calculer_devis</code>) — jamais par le
                  LLM. Un back-office admin permet de suivre l&apos;ensemble des leads, relances et
                  cas complexes.
                </p>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Ce projet est réalisé dans le cadre du <strong>module Data Science</strong> à
                  l&apos;<strong>Epitech</strong>, promotion <strong>2026</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[var(--color-brand)]">L&apos;équipe</h2>
                <p className="mt-2 text-2xl font-semibold text-slate-800">Groupe 16</p>
                <p className="mt-1 text-sm text-slate-500">Epitech — Promotion 2026</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Étudiants en ingénierie informatique, nous avons conçu NeoTravel pour explorer
                  l&apos;intégration de l&apos;IA générative dans un flux métier réel : qualification
                  de leads, pricing et relances commerciales.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-xl font-bold text-[var(--color-brand)]">Objectifs du projet</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {objectifs.map((obj) => (
                <li
                  key={obj}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600"
                >
                  <span className="mt-0.5 text-[var(--color-accent)]">✓</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-xl font-bold text-[var(--color-brand)]">Technologies</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-12 text-center">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-slate-600">Vous souhaitez tester la plateforme ?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="rounded-md bg-[var(--color-wizard)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Discuter avec l&apos;assistant IA
              </Link>
              <Link
                href="/devis"
                className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Formulaire devis rapide
              </Link>
              <Link
                href="/"
                className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
