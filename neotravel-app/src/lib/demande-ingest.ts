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
  listDevis,
  logAction,
  updateDemande,
} from "@/lib/db/memory-store";
import type { Demande, TypeClient } from "@/lib/types";

const LABEL_MANQUANT: Record<string, string> = {
  email: "votre email de contact",
  ville_depart: "la ville de départ",
  ville_arrivee: "la ville d'arrivée",
  date_depart: "la date souhaitée",
  nb_passagers: "le nombre de passagers",
  type_client: "si vous êtes un particulier ou une entreprise",
};

export function parseDemandeFromText(text: string): Partial<Demande> {
  const lower = text.toLowerCase();
  const paxMatch = text.match(/(\d+)\s*(personnes|passagers|pax|personne)/i);
  const kmMatch = text.match(/(\d+)\s*km/i);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const dateMatch = text.match(/(\d{1,2})[\/\s](\d{1,2})[\/\s](\d{4})/);
  const trajetMatch =
    text.match(/de\s+([A-Za-zÀ-ÿ\s-]+?)\s+(?:à|a|vers|pour)\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s|,|\.|le|$)/i) ??
    text.match(/depuis\s+([A-Za-zÀ-ÿ\s-]+?)\s+(?:à|a|vers|pour)\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s|,|\.|le|$)/i);

  const societeMatch =
    text.match(/entreprise\s+(?:c'est|s'appelle|est)\s+([A-Za-zÀ-ÿ0-9\s-]+)/i) ??
    text.match(/société\s+([A-Za-zÀ-ÿ0-9\s-]+)/i);

  let date_depart: string | undefined;
  if (dateMatch) {
    date_depart = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
  } else {
    const jMatch = lower.match(/(\d{1,2})\s+juillet\s+(\d{4})/);
    if (jMatch) {
      date_depart = `${jMatch[2]}-07-${jMatch[1].padStart(2, "0")}`;
    }
    const moisMatch = lower.match(/(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/);
    if (moisMatch) {
      const mois: Record<string, string> = {
        janvier: "01", février: "02", fevrier: "02", mars: "03", avril: "04",
        mai: "05", juin: "06", juillet: "07", août: "08", aout: "08",
        septembre: "09", octobre: "10", novembre: "11", décembre: "12", decembre: "12",
      };
      const m = mois[moisMatch[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "")] ?? mois[moisMatch[2]];
      if (m) date_depart = `${moisMatch[3]}-${m}-${moisMatch[1].padStart(2, "0")}`;
    }
  }

  const genericDomains = ["gmail.com", "yahoo.fr", "hotmail.com", "outlook.com"];
  const email = emailMatch?.[0];
  let type_client: TypeClient | undefined;
  if (lower.includes("entreprise") || lower.includes("société") || societeMatch) {
    type_client = "entreprise";
  } else if (lower.includes("particulier")) {
    type_client = "particulier";
  } else if (email) {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    type_client = genericDomains.some((d) => domain.includes(d)) ? "particulier" : "entreprise";
  }

  const telMatch = text.match(/(?:0|\+33)[1-9](?:[\s.-]?\d{2}){4}/);

  return {
    nb_passagers: paxMatch ? parseInt(paxMatch[1], 10) : undefined,
    distance_km: kmMatch ? parseInt(kmMatch[1], 10) : undefined,
    email,
    telephone: telMatch?.[0],
    ville_depart: trajetMatch?.[1]?.trim(),
    ville_arrivee: trajetMatch?.[2]?.trim(),
    date_depart,
    type_client,
    societe: societeMatch?.[1]?.trim(),
    nom: societeMatch?.[1]?.trim() ?? (email ? email.split("@")[0]?.replace(/[._]/g, " ") : undefined),
  };
}

function hasParsedData(parsed: Partial<Demande>): boolean {
  return Object.values(parsed).some((v) => v !== undefined && v !== null && v !== "");
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

export interface PipelineResult {
  replyHint: string;
  /** Si défini, le chat affiche ce texte sans passer par le LLM (évite les inventions). */
  directReply?: string;
}

export interface PipelineOptions {
  baseUrl?: string;
  /** Dernier message seul — pour distinguer question libre vs mise à jour trajet. */
  lastUserText?: string;
}

function isConversationalOnly(text: string): boolean {
  const parsed = parseDemandeFromText(text);
  const hasTripData = !!(
    parsed.nb_passagers ||
    parsed.ville_depart ||
    parsed.ville_arrivee ||
    parsed.date_depart ||
    parsed.email ||
    parsed.type_client
  );
  return !hasTripData;
}

/** Qualification + devis côté serveur — le LLM ne fait que reformuler. */
export async function processDemandePipeline(
  sessionRef: { current: string | null },
  userText: string,
  options?: PipelineOptions,
): Promise<PipelineResult> {
  const parsed = parseDemandeFromText(userText);
  if (!hasParsedData(parsed)) {
    return {
      replyHint:
        "Demande le trajet en langage simple : d'où, vers où, quelle date, combien de personnes, et un email.",
    };
  }

  let demande;
  if (sessionRef.current) {
    demande = await updateDemande(sessionRef.current, parsed);
  } else {
    demande = await createDemande({ ...parsed, statut: "nouveau" });
    sessionRef.current = demande.id;
  }
  if (!demande) {
    return { replyHint: "Erreur technique. Demandez au client de réessayer." };
  }

  demande = await enrichirDistance(demande);

  const missing = champsManquantsClient(demande);
  const score = computeCompletude(demande);

  if (missing.length > 0) {
    const lisible = missing.map((k) => LABEL_MANQUANT[k] ?? k).join(", ");
    await updateDemande(demande.id, { statut: "incomplet", score_completude: score });
    const hint = `Il manque encore : ${lisible}. Pose UNE question simple au client. Ne demande JAMAIS la distance, la durée ni le prix — on les calcule nous-mêmes.`;
    return {
      replyHint: hint,
      directReply: `Merci pour ces informations (complétude : ${score}%).\n\nIl me manque encore : ${lisible}.\n\nPouvez-vous me le préciser ?`,
    };
  }

  const existingDevis = (await listDevis()).find((d) => d.demande_id === demande.id);
  if (demande.statut === "devis_envoye" && existingDevis) {
    const last = options?.lastUserText?.trim() ?? "";
    if (last && isConversationalOnly(last)) {
      const est = estimerTrajet(demande.ville_depart!, demande.ville_arrivee!);
      return {
        replyHint: `Le devis est déjà envoyé (${existingDevis.prix_ttc.toFixed(2)} € TTC, ${demande.ville_depart} → ${demande.ville_arrivee}${est ? `, ~${est.duree_heures} h` : ""}). Réponds à la question du client. Tu es NeoTravel, propulsé par Ollama llama3.2 en local. Ne répète pas tout le devis sauf si demandé.`,
      };
    }
    const est = estimerTrajet(demande.ville_depart!, demande.ville_arrivee!);
    return {
      replyHint: "Devis déjà envoyé.",
      directReply: formatDevisClientMessage(demande, existingDevis, est, "Votre devis a déjà été envoyé par email."),
    };
  }

  const urgence = determinerUrgence(new Date(), new Date(demande.date_depart!));
  await updateDemande(demande.id, { statut: "qualifie", urgence, score_completude: 100 });

  const devisResult = calculerDevis({
    nb_passagers: demande.nb_passagers!,
    date_depart: demande.date_depart!,
    distance_km: demande.distance_km!,
  });

  await logAction(
    "calculer_devis",
    { source: "pipeline_chat", ...devisResult, distance_km: demande.distance_km },
    demande.id,
  );

  if (devisResult.erreur || devisResult.escalade) {
    await updateDemande(demande.id, {
      statut: "cas_complexe",
      cas_complexe: true,
      motif_complexe: devisResult.motif ?? devisResult.erreur,
    });
    return {
      replyHint: `Dossier à reprendre par un conseiller : ${devisResult.motif ?? devisResult.erreur}. Rassurez le client qu'on le rappelle sous 24 h.`,
      directReply: `Votre demande nécessite l'intervention d'un conseiller NeoTravel.\n\nMotif : ${devisResult.motif ?? devisResult.erreur}\n\nUn commercial vous contactera sous 24 h.`,
    };
  }

  const devis = await createDevis({
    demande_id: demande.id,
    ...devisResult,
    statut: "envoye",
    envoye_at: new Date().toISOString(),
  });

  await updateDemande(demande.id, { statut: "devis_envoye" });

  let mailOk = false;
  let mailSimulated = false;
  let mailErr: string | undefined;
  if (demande.email) {
    const mail = await sendDevisConfirmationEmail(demande, devis, options?.baseUrl);
    mailOk = mail.ok;
    mailSimulated = !!mail.simulated;
    mailErr = mail.error;
    await planifierRelancesDemande(demande.id, demande.email, urgence);
  }

  const est = estimerTrajet(demande.ville_depart!, demande.ville_arrivee!);
  const emailNote =
    mailOk && !mailSimulated
      ? `✉️ Email envoyé à ${demande.email}.`
      : mailOk && mailSimulated
        ? "✉️ Email simulé (configurez SMTP dans .env)."
        : mailErr
          ? `⚠️ Email non envoyé : ${mailErr}`
          : "";

  const clientMsg = formatDevisClientMessage(demande, devis, est, emailNote);

  return {
    replyHint: `Devis prêt — communique ces chiffres EXACTS au client :
Trajet : ${demande.ville_depart} → ${demande.ville_arrivee}
Date : ${demande.date_depart}
${demande.nb_passagers} passagers
Distance estimée : ${demande.distance_km} km${est ? ` (~${est.duree_heures} h de route)` : ""}
Devis TTC : ${devisResult.prix_ttc.toFixed(2)} € (HT : ${devisResult.prix_ht.toFixed(2)} €)
${emailNote}
Lien devis : /api/devis/${devis.id}
Ne demande plus d'informations techniques au client.`,
    directReply: clientMsg,
  };
}

function formatDevisClientMessage(
  demande: Demande,
  devis: { id: string; prix_ttc: number; prix_ht: number },
  est: { duree_heures: number } | null,
  emailNote: string,
): string {
  return `Parfait ! Votre devis est prêt.

📋 Trajet : ${demande.ville_depart} → ${demande.ville_arrivee}
📅 ${demande.date_depart} · 👥 ${demande.nb_passagers} passagers
📏 ${demande.distance_km} km${est ? ` (~${est.duree_heures} h de route)` : ""}

💰 **Devis TTC : ${devis.prix_ttc.toFixed(2)} €** (HT : ${devis.prix_ht.toFixed(2)} €)

📄 Votre devis : /api/devis/${devis.id}
${emailNote}`.trim();
}

export function extractAllUserText(
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>,
): string {
  return messages
    .filter((m) => m.role === "user")
    .flatMap((m) =>
      (m.parts ?? [])
        .filter((p): p is { type: "text"; text: string } => p.type === "text" && !!p.text)
        .map((p) => p.text),
    )
    .join("\n");
}

export function extractLastUserText(
  messages: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }>,
): string {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.parts) return "";
  return last.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text" && !!p.text)
    .map((p) => p.text)
    .join(" ");
}

/** @deprecated utilise processDemandePipeline */
export async function ingestDemandeFromText(
  sessionRef: { current: string | null },
  userText: string,
): Promise<void> {
  await processDemandePipeline(sessionRef, userText);
}

export interface WizardDemandeInput {
  type_trajet: "aller_simple" | "aller_retour";
  nb_passagers: number;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  date_retour?: string;
  commentaire?: string;
  type_client: TypeClient;
  nom: string;
  prenom?: string;
  telephone?: string;
  email: string;
  societe?: string;
}

export interface WizardDemandeRecap {
  demande_id: string;
  devis_id?: string;
  ville_depart: string;
  ville_arrivee: string;
  type_trajet: string;
  nb_passagers: number;
  date_depart: string;
  distance_km?: number;
  duree_heures?: number;
  prix_ttc?: number;
  prix_ht?: number;
  email_sent: boolean;
  email_simulated?: boolean;
  email_error?: string;
  cas_complexe?: boolean;
  motif?: string;
}

/** Soumission formulaire wizard — pipeline complet sans LLM. */
export async function processWizardDemande(
  input: WizardDemandeInput,
  options?: { baseUrl?: string },
): Promise<WizardDemandeRecap> {
  const nomComplet = [input.prenom, input.nom].filter(Boolean).join(" ").trim() || input.nom;

  let demande = await createDemande({
    type_trajet: input.type_trajet,
    nb_passagers: input.nb_passagers,
    ville_depart: input.ville_depart.trim(),
    ville_arrivee: input.ville_arrivee.trim(),
    date_depart: input.date_depart,
    date_retour: input.date_retour,
    commentaire: input.commentaire?.trim(),
    type_client: input.type_client,
    nom: nomComplet,
    societe: input.type_client === "entreprise" ? input.societe?.trim() : undefined,
    email: input.email.trim(),
    telephone: input.telephone?.trim(),
    statut: "nouveau",
  });

  demande = await enrichirDistance(demande);

  const est = estimerTrajet(demande.ville_depart!, demande.ville_arrivee!);

  if (!demande.distance_km) {
    await updateDemande(demande.id, {
      statut: "cas_complexe",
      cas_complexe: true,
      motif_complexe: "Villes non reconnues pour l'estimation automatique",
      score_completude: 100,
    });
    return {
      demande_id: demande.id,
      ville_depart: demande.ville_depart!,
      ville_arrivee: demande.ville_arrivee!,
      type_trajet: input.type_trajet,
      nb_passagers: demande.nb_passagers!,
      date_depart: demande.date_depart!,
      cas_complexe: true,
      motif: "Villes non reconnues — un conseiller vous contactera sous 24 h.",
      email_sent: false,
    };
  }

  const urgence = determinerUrgence(new Date(), new Date(demande.date_depart!));
  await updateDemande(demande.id, { statut: "qualifie", urgence, score_completude: 100 });

  const devisResult = calculerDevis({
    nb_passagers: demande.nb_passagers!,
    date_depart: demande.date_depart!,
    distance_km: demande.distance_km,
  });

  await logAction(
    "calculer_devis",
    { source: "pipeline_wizard", ...devisResult, distance_km: demande.distance_km },
    demande.id,
  );

  if (devisResult.erreur || devisResult.escalade) {
    await updateDemande(demande.id, {
      statut: "cas_complexe",
      cas_complexe: true,
      motif_complexe: devisResult.motif ?? devisResult.erreur,
    });
    return {
      demande_id: demande.id,
      ville_depart: demande.ville_depart!,
      ville_arrivee: demande.ville_arrivee!,
      type_trajet: input.type_trajet,
      nb_passagers: demande.nb_passagers!,
      date_depart: demande.date_depart!,
      distance_km: demande.distance_km,
      duree_heures: est?.duree_heures,
      cas_complexe: true,
      motif: devisResult.motif ?? devisResult.erreur,
      email_sent: false,
    };
  }

  const devis = await createDevis({
    demande_id: demande.id,
    ...devisResult,
    statut: "envoye",
    envoye_at: new Date().toISOString(),
  });

  await updateDemande(demande.id, { statut: "devis_envoye" });

  let email_sent = false;
  let email_simulated = false;
  let email_error: string | undefined;
  if (demande.email) {
    const mail = await sendDevisConfirmationEmail(demande, devis, options?.baseUrl);
    email_sent = mail.ok;
    email_simulated = !!mail.simulated;
    email_error = mail.error;
    await planifierRelancesDemande(demande.id, demande.email, urgence);
  }

  return {
    demande_id: demande.id,
    devis_id: devis.id,
    ville_depart: demande.ville_depart!,
    ville_arrivee: demande.ville_arrivee!,
    type_trajet: input.type_trajet,
    nb_passagers: demande.nb_passagers!,
    date_depart: demande.date_depart!,
    distance_km: demande.distance_km,
    duree_heures: est?.duree_heures,
    prix_ttc: devisResult.prix_ttc,
    prix_ht: devisResult.prix_ht,
    email_sent,
    email_simulated,
    email_error,
  };
}
