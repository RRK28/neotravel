"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { labelVille } from "@/lib/villes";
import { VilleSelect } from "./VilleSelect";
import type { TypeTrajet } from "./types";

interface HeroDevisFormProps {
  className?: string;
  onOpenWizard?: (data: {
    type_trajet: TypeTrajet;
    nb_passagers: number;
    ville_depart: string;
    ville_arrivee: string;
    date_depart: string;
  }) => void;
}

export function HeroDevisForm({ className = "", onOpenWizard }: HeroDevisFormProps) {
  const router = useRouter();
  const [typeTrajet, setTypeTrajet] = useState<TypeTrajet>("aller_simple");
  const [nbPassagers, setNbPassagers] = useState(20);
  const [villeDepart, setVilleDepart] = useState("");
  const [villeArrivee, setVilleArrivee] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      type_trajet: typeTrajet,
      nb_passagers: nbPassagers,
      ville_depart: labelVille(villeDepart),
      ville_arrivee: labelVille(villeArrivee),
      date_depart: "",
    };

    if (onOpenWizard) {
      onOpenWizard(data);
      return;
    }

    const params = new URLSearchParams();
    params.set("type_trajet", typeTrajet);
    params.set("nb_passagers", String(nbPassagers));
    if (villeDepart.trim()) params.set("ville_depart", labelVille(villeDepart));
    if (villeArrivee.trim()) params.set("ville_arrivee", labelVille(villeArrivee));
    router.push(`/devis?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`hero-devis-form rounded-xl p-4 shadow-lg sm:p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeTrajet("aller_simple")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold sm:text-sm ${
            typeTrajet === "aller_simple"
              ? "bg-[var(--color-wizard)] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Aller simple
        </button>
        <button
          type="button"
          onClick={() => setTypeTrajet("aller_retour")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold sm:text-sm ${
            typeTrajet === "aller_retour"
              ? "bg-[var(--color-wizard)] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Aller-retour
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Passagers</label>
          <input
            type="number"
            min={1}
            max={200}
            value={nbPassagers}
            onChange={(e) => setNbPassagers(parseInt(e.target.value, 10) || 1)}
            className="devis-input w-full sm:w-20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Départ</label>
          <VilleSelect
            value={villeDepart}
            onChange={setVilleDepart}
            placeholder="Ville de départ"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Arrivée</label>
          <VilleSelect
            value={villeArrivee}
            onChange={setVilleArrivee}
            placeholder="Ville d'arrivée"
          />
        </div>
        <button type="submit" className="devis-btn-primary w-full whitespace-nowrap sm:w-auto">
          J&apos;obtiens mon devis
        </button>
      </div>
    </form>
  );
}
