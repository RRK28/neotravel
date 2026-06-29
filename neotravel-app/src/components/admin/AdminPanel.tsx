"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/layout/SiteChrome";
import type { Demande, Devis, DashboardStats, StatutDemande } from "@/lib/types";
import { isStatutDemandeFinal } from "@/lib/types";

const STATUT: Record<string, string> = {
  nouveau: "Nouveau",
  incomplet: "Incomplet",
  qualifie: "Qualifié",
  devis_envoye: "Devis envoyé",
  relance_1: "Relance 1",
  relance_2: "Relance 2",
  accepte: "Accepté",
  refuse: "Refusé",
  cas_complexe: "Cas complexe",
  cloture: "Clôturé",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function refCourte(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function AdminPanel() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailInfo, setEmailInfo] = useState<{ configured: boolean; provider: string } | null>(
    null,
  );
  const [storageBackend, setStorageBackend] = useState<"airtable" | "file" | null>(null);
  const [relanceBusy, setRelanceBusy] = useState(false);
  const [statutBusy, setStatutBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    const data = await res.json();
    setDemandes(data.demandes ?? []);
    setDevis(data.devis ?? []);
    setStats(data.stats ?? null);
    setEmailInfo(data.email ?? null);
    setStorageBackend(data.storage?.backend ?? null);
    setLoading(false);
  };

  const traiterRelances = async () => {
    setRelanceBusy(true);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "process_relances" }),
    });
    await load();
    setRelanceBusy(false);
  };

  const changerStatut = async (demandeId: string, statut: StatutDemande) => {
    setStatutBusy(demandeId);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_demande_statut",
        demande_id: demandeId,
        statut,
      }),
    });
    await load();
    setStatutBusy(null);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const devisParDemande = new Map(devis.map((d) => [d.demande_id, d]));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <h1 className="text-xl font-bold">Demandes reçues</h1>
        <p className="mt-1 text-sm text-gray-500">Suivi des prospects — données du chat</p>

        {stats && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <p>
              {stats.leads_recus} lead{stats.leads_recus > 1 ? "s" : ""} · {stats.devis_generes}{" "}
              devis généré{stats.devis_generes > 1 ? "s" : ""}
              {stats.relances_en_attente > 0 && (
                <> · {stats.relances_en_attente} relance{stats.relances_en_attente > 1 ? "s" : ""} en attente</>
              )}
            </p>
            <div className="flex gap-2">
              {stats.relances_en_attente > 0 && (
                <button
                  type="button"
                  onClick={() => traiterRelances()}
                  disabled={relanceBusy}
                  className="rounded border border-gray-800 bg-gray-800 px-2 py-0.5 text-xs text-white disabled:opacity-50"
                >
                  {relanceBusy ? "envoi…" : "envoyer relances"}
                </button>
              )}
              <button
                type="button"
                onClick={() => load()}
                className="rounded border border-gray-300 px-2 py-0.5 text-xs"
              >
                actualiser
              </button>
            </div>
          </div>
        )}

        {emailInfo && (
          <p className="mt-2 text-xs text-gray-400">
            Emails :{" "}
            {emailInfo.configured
              ? `actifs (${emailInfo.provider})`
              : "simulation console — configurez RESEND ou SMTP dans .env"}
            {storageBackend && (
              <>
                {" · "}Stockage :{" "}
                {storageBackend === "airtable"
                  ? "Airtable (persistant)"
                  : "fichier local (éphémère sur Vercel)"}
              </>
            )}
            {" · "}
            Relances auto :{" "}
            <a
              href="https://app.n8n.cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              n8n Cloud
            </a>{" "}
            (orchestration externe)
          </p>
        )}

        <section className="mt-6 rounded border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
          <h2 className="font-semibold text-gray-800">API n8n</h2>
          <p className="mt-1 text-gray-500">
            Endpoints REST pour l&apos;orchestration n8n (header <code>x-webhook-secret</code> requis
            sur POST, sauf status).
          </p>
          <ul className="mt-2 space-y-1 font-mono">
            <li>GET /api/n8n/status</li>
            <li>POST /api/n8n/qualifier</li>
            <li>POST /api/n8n/calculer-devis</li>
            <li>POST /api/n8n/generer-devis</li>
            <li>POST /api/n8n/relance</li>
          </ul>
        </section>

        {loading ? (
          <p className="mt-8 text-sm text-gray-400">Chargement…</p>
        ) : demandes.length === 0 ? (
          <p className="mt-8 rounded border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Aucune demande pour l&apos;instant. Passez par le{" "}
            <Link href="/chat" className="underline">
              chat
            </Link>{" "}
            pour en créer une.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {demandes.map((d) => {
              const dv = devisParDemande.get(d.id);
              return (
                <article
                  key={d.id}
                  className="rounded border border-gray-300 bg-white p-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {d.ville_depart ?? "—"} → {d.ville_arrivee ?? "—"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {d.email ?? "email non renseigné"}
                        {d.nom ? ` · ${d.nom}` : ""}
                      </p>
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {STATUT[d.statut] ?? d.statut}
                    </span>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-4">
                    <div>
                      <dt className="text-gray-400">Réf.</dt>
                      <dd>{refCourte(d.id)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Date</dt>
                      <dd>{formatDate(d.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Passagers</dt>
                      <dd>{d.nb_passagers ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Distance</dt>
                      <dd>{d.distance_km ? `${d.distance_km} km` : "—"}</dd>
                    </div>
                    {d.date_depart && (
                      <div>
                        <dt className="text-gray-400">Départ</dt>
                        <dd>{d.date_depart}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-400">Complétude</dt>
                      <dd>{d.score_completude}%</dd>
                    </div>
                    {dv && (
                      <div>
                        <dt className="text-gray-400">Devis TTC</dt>
                        <dd className="font-medium text-gray-800">{dv.prix_ttc.toFixed(2)} €</dd>
                      </div>
                    )}
                  </dl>

                  {dv && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={`/api/devis/${dv.id}/pdf`}
                        download
                        className="rounded border border-[#0f1d32] bg-[#0f1d32] px-3 py-1 text-xs font-medium text-white hover:bg-[#1a2d4a]"
                      >
                        PDF
                      </a>
                      <a
                        href={`/api/devis/${dv.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Aperçu web
                      </a>
                    </div>
                  )}

                  {d.cas_complexe && d.motif_complexe && (
                    <p className="mt-2 text-xs text-amber-700">Escalade : {d.motif_complexe}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-400">État :</span>
                    {isStatutDemandeFinal(d.statut) ? (
                      <>
                        <button
                          type="button"
                          disabled={statutBusy === d.id}
                          onClick={() => changerStatut(d.id, "devis_envoye")}
                          className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {statutBusy === d.id ? "…" : "rouvrir (devis envoyé)"}
                        </button>
                        <button
                          type="button"
                          disabled={statutBusy === d.id}
                          onClick={() => changerStatut(d.id, "relance_1")}
                          className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                        >
                          rouvrir (relance 1)
                        </button>
                      </>
                    ) : (
                      <>
                        {dv && (
                          <>
                            <button
                              type="button"
                              disabled={statutBusy === d.id}
                              onClick={() => changerStatut(d.id, "accepte")}
                              className="rounded border border-green-700 bg-green-700 px-2 py-0.5 text-xs text-white hover:bg-green-800 disabled:opacity-50"
                            >
                              accepter
                            </button>
                            <button
                              type="button"
                              disabled={statutBusy === d.id}
                              onClick={() => changerStatut(d.id, "refuse")}
                              className="rounded border border-red-700 bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-800 disabled:opacity-50"
                            >
                              refuser
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={statutBusy === d.id}
                          onClick={() => changerStatut(d.id, "cloture")}
                          className="rounded border border-gray-800 bg-gray-800 px-2 py-0.5 text-xs text-white hover:bg-gray-900 disabled:opacity-50"
                        >
                          {statutBusy === d.id ? "…" : "clôturer"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Link href="/" className="mt-8 inline-block text-sm text-gray-500 underline">
          retour
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
