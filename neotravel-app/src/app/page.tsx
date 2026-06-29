import Link from "next/link";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { AiPoweredBadge } from "@/components/layout/AiPoweredBadge";
import { DEVIS_IMAGES } from "@/lib/devis-images";

const garanties = [
  {
    title: "Réponse rapide",
    text: "L'assistant IA qualifie votre demande et prépare un devis en quelques minutes, 24 h/24.",
  },
  {
    title: "Tarification transparente",
    text: "Calcul automatique basé sur la distance, le nombre de passagers et le type de véhicule.",
  },
  {
    title: "Suivi des demandes",
    text: "Chaque lead est enregistré et suivi jusqu'à l'envoi du devis et aux relances.",
  },
  {
    title: "Conseil personnalisé",
    text: "L'agent pose les bonnes questions pour proposer une offre adaptée à votre trajet.",
  },
];

const etapes = [
  {
    step: "1",
    title: "Décrivez votre besoin",
    text: "Via le chat IA (Option A) ou le formulaire guidé (Option B) : trajet, date, passagers, contact.",
  },
  {
    step: "2",
    title: "Calcul tarifaire métier",
    text: "Le back-office appelle calculer_devis — moteur déterministe, indépendant du LLM.",
  },
  {
    step: "3",
    title: "Devis PDF & relances",
    text: "Envoi du devis par e-mail, relances automatiques et suivi dans le tableau de bord admin.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden text-white">
          <Image
            src={DEVIS_IMAGES.heroBackground}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand)]/95 via-[var(--color-brand)]/85 to-[var(--color-brand)]/70" />
          <div className="relative mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
            <AiPoweredBadge className="mb-4" />
            <p className="text-sm font-medium uppercase tracking-widest text-amber-300">
              Transport autocar avec chauffeur
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Obtenez votre devis gratuitement et rapidement
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">
              NeoTravel automatise la qualification par IA, le calcul tarifaire déterministe et
              l&apos;envoi de devis pour vos transports en autocar.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="rounded-md bg-[var(--color-wizard)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700"
              >
                Discuter avec l&apos;assistant IA
              </Link>
              <Link
                href="/devis"
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Formulaire devis rapide
              </Link>
            </div>
          </div>
        </section>

        {/* Garanties / services */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-[var(--color-brand)]">
              Pourquoi choisir NeoTravel ?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Une chaîne commerciale automatisée pour répondre à vos besoins de transport de groupe.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {garanties.map((g) => (
                <div
                  key={g.title}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-[var(--color-brand)]">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-slate-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-[var(--color-brand)]">
              Comment ça marche ?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600">
              L&apos;IA collecte le besoin → le back-office calcule le prix → vous recevez le devis
              PDF par e-mail.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {etapes.map((e) => (
                <div key={e.step} className="text-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand)] text-lg font-bold text-white">
                    {e.step}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-800">{e.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* À propos (snippet) */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-[var(--color-brand)]">Qui sommes-nous ?</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
                NeoTravel est un projet développé par le <strong>Groupe 16</strong> dans le cadre du
                module Data Science à <strong>Epitech</strong> (promotion 2026). Notre objectif :
                démontrer comment l&apos;IA et l&apos;automatisation peuvent fluidifier la chaîne
                commerciale d&apos;une plateforme de location d&apos;autocars — de la demande
                initiale au devis PDF et aux relances.
              </p>
              <Link
                href="/qui-sommes-nous"
                className="mt-6 inline-block text-sm font-semibold text-[var(--color-brand-light)] hover:underline"
              >
                Découvrir l&apos;équipe et le projet →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-[var(--color-brand)] py-14 text-center text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-bold">Prêt à obtenir votre devis ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">
              Commencez par l&apos;assistant IA — ou utilisez le formulaire guidé si vous préférez.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="rounded-md bg-[var(--color-wizard)] px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-violet-700"
              >
                Discuter avec l&apos;assistant IA
              </Link>
              <Link
                href="/devis"
                className="rounded-md border border-white/30 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Formulaire devis rapide
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
