import Link from "next/link";

const exemples = [
  "35 passagers, Paris → Lyon, le 15/07/2026",
  "Aller-retour Marseille → Nice pour 50 personnes",
  "Transport scolaire Lyon → Grenoble, 28 élèves",
];

/** Panneau hero — Option A (chat IA) mis en avant ; le wizard reste sur /devis (Option B). */
export function HomeHeroSection() {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
        Option A — Assistant conversationnel
      </p>
      <h2 className="mt-2 text-lg font-bold text-white">
        Décrivez votre trajet en langage naturel
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">
        L&apos;agent IA collecte les informations, puis le back-office calcule le tarif via{" "}
        <code className="rounded bg-white/10 px-1 text-xs">calculer_devis</code> — jamais par le
        modèle.
      </p>

      <ul className="mt-4 space-y-2">
        {exemples.map((ex) => (
          <li
            key={ex}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
          >
            « {ex} »
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-slate-300">
        Besoin d&apos;un formulaire guidé ?{" "}
        <Link href="/devis" className="font-semibold text-white underline hover:text-amber-200">
          Option B — devis rapide
        </Link>
      </p>
    </div>
  );
}
