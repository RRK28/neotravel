import { NextResponse } from "next/server";
import {
  listDemandes,
  listDevis,
  listLogs,
  listRelances,
  getDashboardStats,
  getStoreBackend,
  getDemande,
  updateDemande,
} from "@/lib/db/memory-store";
import { processRelancesDue } from "@/lib/email/relances";
import { isEmailConfigured, resolveEmailProvider } from "@/lib/email/config";
import type { StatutDemande } from "@/lib/types";

const STATUTS_ADMIN: StatutDemande[] = [
  "devis_envoye",
  "relance_1",
  "relance_2",
  "accepte",
  "refuse",
  "cloture",
];

export async function GET() {
  const stats = await getDashboardStats();
  const demandes = await listDemandes();
  const devis = await listDevis();
  const relances = await listRelances();
  const logs = await listLogs(50);
  return NextResponse.json({
    stats,
    demandes,
    devis,
    relances,
    logs,
    storage: {
      backend: getStoreBackend(),
    },
    email: {
      configured: isEmailConfigured(),
      provider: resolveEmailProvider(),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "process_relances") {
    const baseUrl = body.baseUrl ?? new URL(req.url).origin;
    const results = await processRelancesDue(baseUrl);
    return NextResponse.json({
      traitees: results.filter((r) => r.email_sent).length,
      results,
    });
  }

  if (body.action === "update_demande_statut") {
    const demandeId = body.demande_id as string | undefined;
    const statut = body.statut as StatutDemande | undefined;

    if (!demandeId || !statut) {
      return NextResponse.json({ error: "demande_id et statut requis" }, { status: 400 });
    }
    if (!STATUTS_ADMIN.includes(statut)) {
      return NextResponse.json({ error: "Statut non autorisé" }, { status: 400 });
    }

    const existing = await getDemande(demandeId);
    if (!existing) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const demande = await updateDemande(demandeId, { statut });
    return NextResponse.json({ demande });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
