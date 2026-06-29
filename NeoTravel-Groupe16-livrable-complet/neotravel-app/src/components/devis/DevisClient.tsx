"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DevisWizard } from "@/components/devis/DevisWizard";
import { formDataFromSearchParams } from "@/components/devis/types";

function DevisPageContent() {
  const searchParams = useSearchParams();
  const initialData = formDataFromSearchParams(searchParams);

  return <DevisWizard initialData={initialData} />;
}

export function DevisPageClient() {
  return (
    <Suspense
      fallback={
        <div className="devis-wizard-card mx-auto max-w-2xl animate-pulse p-8 text-center text-slate-400">
          Chargement…
        </div>
      }
    >
      <DevisPageContent />
    </Suspense>
  );
}
