import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Qui sommes-nous — NeoTravel",
  description:
    "NeoTravel, courtier en location d'autocar avec chauffeur depuis 2010. Découvrez notre histoire et notre équipe.",
};

const engagements = [
  "Autocars récents et chauffeurs professionnels certifiés.",
  "Devis détaillé sous 24 h, sans engagement.",
  "Accompagnement personnalisé pour chaque type d'événement.",
  "Couverture nationale en France et en Belgique.",
];

const specialites = [
  "Sorties scolaires et universitaires",
  "Séminaires et team building",
  "Mariages et événements privés",
  "Transferts aéroport et gare",
  "Pèlerinages et voyages associatifs",
  "Déplacements d'entreprise",
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
              Depuis 2010, NeoTravel met son expertise au service de vos transports de groupe.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-brand)]">Notre histoire</h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  NeoTravel est né d&apos;une idée simple : faciliter la réservation d&apos;autocars
                  pour les organisateurs qui n&apos;ont pas le temps de comparer une dizaine de
                  transporteurs. En tant que courtier, nous sélectionnons le véhicule adapté à
                  votre budget et à vos contraintes — sortie scolaire, séminaire, mariage ou
                  transfert aéroport.
                </p>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Aujourd&apos;hui, nous organisons plus de 500 trajets par an pour des entreprises,
                  des associations, des établissements scolaires et des particuliers. Notre équipe
                  commerciale connaît le terrain et vous accompagne de la demande de devis à la
                  confirmation de la réservation.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-bold text-[var(--color-brand)]">Nos engagements</h2>
                <ul className="mt-4 space-y-3">
                  {engagements.map((e) => (
                    <li key={e} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                      <span className="mt-0.5 text-[var(--color-accent)]">✓</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-xl font-bold text-[var(--color-brand)]">Nos spécialités</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specialites.map((s) => (
                <div
                  key={s}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700"
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <h2 className="text-xl font-bold text-[var(--color-brand)]">
                Besoin d&apos;un devis ?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-600">
                Décrivez votre projet — nous vous répondons sous 24 h, du lundi au vendredi.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <Link
                  href="/chat"
                  className="rounded-md bg-[var(--color-wizard)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Devis en ligne
                </Link>
                <Link
                  href="/devis"
                  className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Formulaire détaillé
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
