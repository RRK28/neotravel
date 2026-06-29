import { formatISO } from "date-fns";
import { parseDemandeFromText } from "@/lib/demande-ingest";
import { calculerDevis, determinerUrgence } from "@/lib/pricing/calculer-devis";
import { estimerTrajet } from "@/lib/pricing/estimer-trajet";
import { sendDevisConfirmationEmail } from "@/lib/email/notifications";
import { planifierRelancesDemande } from "@/lib/email/relances";
import {
  champsManquantsClient,
  computeCompletude,
  createDemande,
  createDevis,
  getDemande,
  getRelancesDue,
  listDevis,
  logAction,
  updateDemande,
} from "@/lib/db/memory-store";
import type { Demande, TypeClient } from "@/lib/types";

export interface QualifierInput {
  text?: string;
  demande_id?: string;
  type_client?: TypeClient;
  nom?: string;
  prenom?: string;
  societe?: string;
  email?: string;
  telephone?: string;
  ville_depart?: string;
  ville_arrivee?: string;
  date_depart?: string;
  date_retour?: string;
  nb_passagers?: number;
  distance_km?: number;
  type_trajet?: string;
  commentaire?: string;
}

async function enrichirDistance(demande: Demande): Promise<Demande> {
  if (demande.distance_km || !demande.ville_depart || !demande.ville_arrivee) return demande;
  const est = estimerTrajet(demande.ville_depart, demande.ville_arrivee);
  if (!est) return demande;
  const updated = await updateDemande(demande.id, {
    distance_km: est.distance_km,
    commentaire: `Distance estimée ${est.distance_km} km (~${est.duree_heures} h)`,
  });
  return updated ?? demande;
}

function mergeQualifierFields(input: QualifierInput): Partial<Demande> {
  const { text, demande_id: _id, ...fields } = input;
  const parsed = text ? parseDemandeFromText(text) : {};
  const merged: Partial<Demande> = { ...parsed };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== "") {
      (merged as Record<string, unknown>)[key] = value;
    }
  }

  return merged;
}

/** Qualifie une demande (parse texte ou champs structurés) — outil n8n / agent. */
export async function n8nQualifier(input: QualifierInput) {
  const merged = mergeQualifierFields(input);
  const hasData = Object.values(merged).some((v) => v !== undefined && v !== null && v !== "");

  if (!hasData && !input.demande_id) {
    return { erreur: "Fournir text ou champs demande (ville_depart, email, etc.)" };
  }

  let demande: Demande | null | undefined;
  if (input.demande_id) {
    demande = await updateDemande(input.demande_id, merged);
  } else if (hasData) {
    demande = await createDemande({ ...merged, statut: "nouveau" });
  } else {
    demande = await getDemande(input.demande_id!);
  }

  if (!demande) {
    return { erreur: "Demande introuvable" };
  }

  demande = await enrichirDistance(demande);

  const missing = champsManquantsClient(demande);
  const score = computeCompletude(demande);
  let urgence = demande.urgence;

  if (demande.date_depart) {
    urgence = determinerUrgence(new Date(), new Date(demande.date_depart));
  }

  const statut = missing.length === 0 ? "qualifie" : "incomplet";
  await updateDemande(demande.id, { statut, score_completude: score, urgence });

  await logAction("qualifier_demande", { source: "n8n", score, missing }, demande.id);

  return {
    demande_id: demande.id,
    statut,
    score_completude: score,
    missing,
    champs_manquants: missing,
    urgence,
    pret_pour_devis: missing.length === 0,
    distance_km: demande.distance_km,
    ville_depart: demande.ville_depart,
    ville_arrivee: demande.ville_arrivee,
  };
}

/** Calcule le devis pour une demande qualifiée — outil n8n. */
export async function n8nCalculerDevis(demandeId: string) {
  let demande = await getDemande(demandeId);
  if (!demande) {
    return { erreur: "Demande introuvable" };
  }

  demande = await enrichirDistance(demande);

  const missing = champsManquantsClient(demande);
  if (missing.length > 0) {
    return {
      erreur: "Demande incomplète",
      missing,
      score_completude: computeCompletude(demande),
    };
  }

  if (!demande.distance_km) {
    return {
      erreur: "Distance non estimable — escalade conseillée",
      cas_complexe: true,
    };
  }

  const result = calculerDevis({
    nb_passagers: demande.nb_passagers!,
    date_depart: demande.date_depart!,
    date_demande: formatISO(new Date(), { representation: "date" }),
    distance_km: demande.distance_km,
  });

  await logAction(
    "calculer_devis",
    { source: "n8n", ...result, distance_km: demande.distance_km },
    demande.id,
  );

  if (result.erreur || result.escalade) {
    await updateDemande(demande.id, {
      statut: "cas_complexe",
      cas_complexe: true,
      motif_complexe: result.motif ?? result.erreur,
    });
    return {
      demande_id: demande.id,
      cas_complexe: true,
      motif: result.motif ?? result.erreur,
      ...result,
    };
  }

  const urgence = determinerUrgence(new Date(), new Date(demande.date_depart!));
  await updateDemande(demande.id, { statut: "qualifie", urgence, score_completude: 100 });

  return {
    demande_id: demande.id,
    prix_ht: result.prix_ht,
    prix_ttc: result.prix_ttc,
    tva: result.tva,
    lignes: result.lignes,
    coefficients: result.coefficients,
    urgence,
  };
}

/** Génère le devis (PDF + email + relances) — outil n8n. */
export async function n8nGenererDevis(demandeId: string, baseUrl?: string) {
  let demande = await getDemande(demandeId);
  if (!demande) {
    return { erreur: "Demande introuvable" };
  }

  const existing = (await listDevis()).find((d) => d.demande_id === demandeId);
  if (existing && demande.statut === "devis_envoye") {
    return {
      devis_id: existing.id,
      demande_id: demandeId,
      prix_ttc: existing.prix_ttc,
      prix_ht: existing.prix_ht,
      deja_existant: true,
      pdf_url: `/api/devis/${existing.id}/pdf`,
    };
  }

  const calc = await n8nCalculerDevis(demandeId);
  if ("erreur" in calc && calc.erreur) {
    return calc;
  }
  if (calc.cas_complexe) {
    return calc;
  }

  demande = (await getDemande(demandeId))!;

  const devis = await createDevis({
    demande_id: demandeId,
    prix_ht: calc.prix_ht!,
    tva: calc.tva!,
    prix_ttc: calc.prix_ttc!,
    lignes: calc.lignes ?? [],
    coefficients: calc.coefficients ?? [],
    devise: "EUR",
    statut: "envoye",
    envoye_at: new Date().toISOString(),
  });

  await updateDemande(demandeId, { statut: "devis_envoye" });

  let email_sent = false;
  let email_simulated = false;
  let email_error: string | undefined;

  if (demande.email) {
    const mail = await sendDevisConfirmationEmail(demande, devis, baseUrl);
    email_sent = mail.ok;
    email_simulated = !!mail.simulated;
    email_error = mail.error;
    await planifierRelancesDemande(demandeId, demande.email, calc.urgence);
  }

  await logAction("generer_devis", { source: "n8n", devis_id: devis.id }, demandeId);

  return {
    devis_id: devis.id,
    demande_id: demandeId,
    prix_ttc: devis.prix_ttc,
    prix_ht: devis.prix_ht,
    pdf_url: `/api/devis/${devis.id}/pdf`,
    web_url: `/api/devis/${devis.id}`,
    email_sent,
    email_simulated,
    email_error,
  };
}

/** Santé API n8n + relances en attente. */
export async function n8nStatus() {
  const due = await getRelancesDue();
  const devis = await listDevis();
  return {
    ok: true,
    service: "neotravel-n8n",
    pending_relances: due.length,
    relances_dues: due.map((r) => ({
      id: r.id,
      demande_id: r.demande_id,
      numero: r.numero,
      date_prevue: r.date_prevue,
    })),
    devis_count: devis.length,
    timestamp: new Date().toISOString(),
  };
}
