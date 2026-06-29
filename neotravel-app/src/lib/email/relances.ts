import {
  annulerRelancesDemande,
  createRelance,
  getDemande,
  getRelancesDue,
  listDevis,
  processRelance,
} from "@/lib/db/memory-store";
import { isStatutDemandeFinal, type UrgenceCode } from "@/lib/types";
import { sendRelanceEmail } from "@/lib/email/notifications";

export { annulerRelancesDemande };

export async function planifierRelancesDemande(
  demandeId: string,
  email: string,
  _urgence?: UrgenceCode,
): Promise<void> {
  const isDemo =
    process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development";

  const date1 = new Date();
  const date2 = new Date();

  if (isDemo) {
    date1.setMinutes(date1.getMinutes() + 2);
    date2.setMinutes(date2.getMinutes() + 7);
  } else {
    date1.setDate(date1.getDate() + 2);
    date2.setDate(date2.getDate() + 7);
  }

  await createRelance({
    demande_id: demandeId,
    numero: 1,
    date_prevue: date1.toISOString(),
    statut: "en_attente",
    email_destinataire: email,
  });

  await createRelance({
    demande_id: demandeId,
    numero: 2,
    date_prevue: date2.toISOString(),
    statut: "en_attente",
    email_destinataire: email,
  });
}

export interface RelanceProcessResult {
  relance_id: string;
  numero: number;
  email?: string;
  email_sent: boolean;
  email_simulated?: boolean;
  error?: string;
  statut?: string;
}

export async function processRelancesDue(baseUrl?: string): Promise<RelanceProcessResult[]> {
  const due = await getRelancesDue();
  const allDevis = await listDevis();
  const results: RelanceProcessResult[] = [];

  for (const relance of due) {
    const demande = await getDemande(relance.demande_id);
    const devis = allDevis.find((d) => d.demande_id === relance.demande_id);

    if (!demande || !devis) {
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        email_sent: false,
        error: "Demande ou devis introuvable",
      });
      continue;
    }

    if (isStatutDemandeFinal(demande.statut)) {
      await annulerRelancesDemande(relance.demande_id);
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        email_sent: false,
        statut: "annulee",
        error: `Demande en statut final : ${demande.statut}`,
      });
      continue;
    }

    const mail = await sendRelanceEmail(
      demande,
      devis,
      relance.numero as 1 | 2,
      baseUrl,
    );

    if (!mail.ok) {
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        email: relance.email_destinataire,
        email_sent: false,
        error: mail.error,
      });
      continue;
    }

    const processed = await processRelance(relance.id);
    results.push({
      relance_id: relance.id,
      numero: relance.numero,
      email: relance.email_destinataire,
      email_sent: true,
      email_simulated: mail.simulated,
      statut: processed?.statut,
    });
  }

  return results;
}
