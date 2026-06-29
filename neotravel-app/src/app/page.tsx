import Link from "next/link";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { AiPoweredBadge } from "@/components/layout/AiPoweredBadge";
import { DEVIS_IMAGES } from "@/lib/devis-images";

const garanties = [
  {
    title: "Réponse sous 24 h",
    text: "Un conseiller étudie votre trajet et vous adresse un devis détaillé, même en dehors des horaires de bureau.",
  },
  {
    title: "Tarifs clairs",
    text: "Prix calculé selon la distance, le nombre de passagers et le type de véhicule — sans surprise à la réservation.",
  },
  {
    title: "Réseau national",
    text: "Autocars récents, chauffeurs professionnels et partenaires certifiés sur l'ensemble du territoire.",
  },
  {
    title: "Accompagnement sur mesure",
    text: "Sorties scolaires, séminaires, mariages, transferts aéroport : nous adaptons l'offre à votre événement.",
  },
];

const etapes = [
  {
    step: "1",
    title: "Décrivez votre trajet",
    text: "Par message ou via le formulaire : villes, dates, nombre de passagers et vos coordonnées.",
  },
  {
    step: "2",
    title: "Étude de votre demande",
    text: "Nos équipes vérifient la faisabilité, le véhicule adapté et établissent votre tarif.",
  },
  {
    step: "3",
    title: "Devis par e-mail",
    text: "Vous recevez un devis PDF. Un conseiller reste disponible pour ajuster les détails.",
  },
];

const trustSignals = [
  { value: "15 ans", label: "d'expérience" },
  { value: "500+", label: "trajets par an" },
  { value: "24 h", label: "pour un premier retour" },
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
              Location d&apos;autocar avec chauffeur — depuis 2010
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Votre autocariste en 24 h
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">
              NeoTravel organise vos transports de groupe partout en France et en Belgique.
              Devis gratuit, flotte moderne et équipe commerciale à votre écoute.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {trustSignals.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-slate-300">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="rounded-md bg-[var(--color-wizard)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700"
              >
                Obtenir mon devis
              </Link>
              <Link
                href="/devis"
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Formulaire détaillé
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-[var(--color-brand)]">
              Pourquoi choisir NeoTravel ?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Courtier en transport autocar, nous mettons notre réseau de transporteurs au service
              de vos déplacements professionnels et privés.
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

        <section className="bg-slate-100 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold text-[var(--color-brand)]">
              Comment obtenir votre devis ?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600">
              Trois étapes simples, sans engagement.
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

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 sm:p-10">
              <h2 className="text-2xl font-bold text-[var(--color-brand)]">Qui sommes-nous ?</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
                Fondée en 2010, NeoTravel est un courtier spécialisé dans la location d&apos;autocars
                avec chauffeur. Entreprises, associations, établissements scolaires et
                particuliers nous confient chaque année leurs transferts, excursions et événements.
                Notre métier : trouver le bon véhicule au bon prix, rapidement.
              </p>
              <Link
                href="/qui-sommes-nous"
                className="mt-6 inline-block text-sm font-semibold text-[var(--color-brand-light)] hover:underline"
              >
                En savoir plus sur NeoTravel →
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand)] py-14 text-center text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-bold">Un projet de transport en tête ?</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">
              Décrivez-nous votre besoin en quelques lignes — réponse garantie sous 24 h.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/chat"
                className="rounded-md bg-[var(--color-wizard)] px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-violet-700"
              >
                Parler à un conseiller
              </Link>
              <Link
                href="/devis"
                className="rounded-md border border-white/30 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Formulaire détaillé
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
