import {
  annulerRelancesDemande,
  champsManquantsClient,
  createRelance,
  getDemande,
  getRelancesDue,
  listDevis,
  processRelance,
} from "@/lib/db/memory-store";
import { isStatutDemandeFinal, type RelanceType, type UrgenceCode } from "@/lib/types";
import { sendRelanceEmail, sendRelanceIncompleteEmail } from "@/lib/email/notifications";

export { annulerRelancesDemande };

function computeRelanceDates(): [Date, Date] {
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

  return [date1, date2];
}

async function planifierRelancesPair(
  demandeId: string,
  email: string,
  type: RelanceType,
): Promise<void> {
  const [date1, date2] = computeRelanceDates();

  await createRelance({
    demande_id: demandeId,
    numero: 1,
    type,
    date_prevue: date1.toISOString(),
    statut: "en_attente",
    email_destinataire: email,
  });

  await createRelance({
    demande_id: demandeId,
    numero: 2,
    type,
    date_prevue: date2.toISOString(),
    statut: "en_attente",
    email_destinataire: email,
  });
}

export async function planifierRelancesDemande(
  demandeId: string,
  email: string,
  _urgence?: UrgenceCode,
): Promise<void> {
  await planifierRelancesPair(demandeId, email, "devis");
}

export async function planifierRelancesIncomplet(
  demandeId: string,
  email: string,
): Promise<void> {
  await annulerRelancesDemande(demandeId, "incomplet");
  await planifierRelancesPair(demandeId, email, "incomplet");
}

export interface RelanceProcessResult {
  relance_id: string;
  numero: number;
  type?: RelanceType;
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
    const relanceType = relance.type ?? "devis";
    const demande = await getDemande(relance.demande_id);

    if (!demande) {
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        type: relanceType,
        email_sent: false,
        error: "Demande introuvable",
      });
      continue;
    }

    if (isStatutDemandeFinal(demande.statut)) {
      await annulerRelancesDemande(relance.demande_id);
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        type: relanceType,
        email_sent: false,
        statut: "annulee",
        error: `Demande en statut final : ${demande.statut}`,
      });
      continue;
    }

    if (relanceType === "incomplet") {
      const devis = allDevis.find((d) => d.demande_id === relance.demande_id);
      const missing = champsManquantsClient(demande);

      if (devis || missing.length === 0) {
        await annulerRelancesDemande(relance.demande_id, "incomplet");
        results.push({
          relance_id: relance.id,
          numero: relance.numero,
          type: relanceType,
          email_sent: false,
          statut: "annulee",
          error: devis ? "Devis déjà généré" : "Demande complétée",
        });
        continue;
      }

      const mail = await sendRelanceIncompleteEmail(
        demande,
        missing,
        relance.numero as 1 | 2,
        baseUrl,
      );

      if (!mail.ok) {
        results.push({
          relance_id: relance.id,
          numero: relance.numero,
          type: relanceType,
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
        type: relanceType,
        email: relance.email_destinataire,
        email_sent: true,
        email_simulated: mail.simulated,
        statut: processed?.statut,
      });
      continue;
    }

    const devis = allDevis.find((d) => d.demande_id === relance.demande_id);

    if (!devis) {
      results.push({
        relance_id: relance.id,
        numero: relance.numero,
        type: relanceType,
        email_sent: false,
        error: "Devis introuvable",
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
        type: relanceType,
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
      type: relanceType,
      email: relance.email_destinataire,
      email_sent: true,
      email_simulated: mail.simulated,
      statut: processed?.statut,
    });
  }

  return results;
}
