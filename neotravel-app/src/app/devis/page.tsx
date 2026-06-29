/**
 * Option B — parcours alternatif : formulaire guidé en 3 étapes.
 * Même pipeline métier que /chat (Option A) via processWizardDemande → processDemandePipeline.
 */
import Link from "next/link";
import Image from "next/image";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import { DevisPageClient } from "@/components/devis/DevisClient";
import { DEVIS_IMAGES } from "@/lib/devis-images";

export default function DevisPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="relative flex-1 overflow-x-hidden">
        <Image
          src={DEVIS_IMAGES.devisPageBackground}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/95 via-slate-100/92 to-slate-100/95" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[var(--color-brand)] sm:text-3xl">
              Demandez votre devis
            </h1>
            <p className="mt-2 text-slate-600">
              <span className="font-medium text-slate-700">Option B</span> — formulaire guidé en 3
              étapes. Parcours recommandé :{" "}
              <Link href="/chat" className="font-semibold text-[var(--color-wizard)] hover:underline">
                Option A — assistant IA
              </Link>
              .
            </p>
          </div>

          <DevisPageClient />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
