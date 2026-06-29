import { tool } from "ai";
import { z } from "zod";
import { addDays, formatISO } from "date-fns";
import { calculerDevis, determinerUrgence } from "@/lib/pricing/calculer-devis";
import { SAISON_PAR_MOIS, URGENCE_CODES, getCapaciteCoefficient } from "@/lib/pricing/matrices";
import {
  champsManquants,
  computeCompletude,
  createDemande,
  createDevis,
  createRelance,
  getDemande,
  logAction,
  updateDemande,
} from "@/lib/db/memory-store";
import { generateDevisText } from "@/lib/pdf/generate-devis";
import type { Demande } from "@/lib/types";

export function createAgentTools(sessionDemandeId: { current: string | null }) {
  return {
    qualifier_demande: tool({
      description:
        "Enregistre ou met à jour une demande prospect. Retourne le score de complétude et les champs manquants.",
      inputSchema: z.object({
        demande_id: z.string().optional(),
        type_client: z.enum(["particulier", "entreprise", "collectivite", "association"]).optional(),
        nom: z.string().optional(),
        societe: z.string().optional(),
        email: z.string().optional(),
        telephone: z.string().optional(),
        ville_depart: z.string().optional(),
        ville_arrivee: z.string().optional(),
        date_depart: z.string().optional(),
        date_retour: z.string().optional(),
        nb_passagers: z.number().optional(),
        distance_km: z.number().optional(),
        type_trajet: z.string().optional(),
        options: z.array(z.string()).optional(),
        commentaire: z.string().optional(),
      }),
      execute: async (input) => {
        const enriched = { ...input };
        const genericDomains = ["gmail.com", "yahoo.fr", "hotmail.com", "outlook.com", "icloud.com"];
        if (enriched.email && !enriched.type_client) {
          const domain = enriched.email.split("@")[1]?.toLowerCase() ?? "";
          enriched.type_client = genericDomains.some((d) => domain.includes(d))
            ? "particulier"
            : "entreprise";
        }
        if (enriched.email && !enriched.nom) {
          enriched.nom = enriched.email.split("@")[0]?.replace(/[._]/g, " ") || "Client";
        }

        let demande;
        if (enriched.demande_id || sessionDemandeId.current) {
          const id = enriched.demande_id ?? sessionDemandeId.current!;
          demande = await updateDemande(id, enriched as Partial<Demande>);
        } else {
          demande = await createDemande(enriched as Partial<Demande>);
          sessionDemandeId.current = demande.id;
        }

        if (!demande) return { erreur: "Demande introuvable" };

        const missing = champsManquants(demande);
        const score = computeCompletude(demande);
        let urgence = demande.urgence;
        if (demande.date_depart) {
          urgence = determinerUrgence(new Date(), new Date(demande.date_depart));
          await updateDemande(demande.id, { urgence });
        }

        const statut = missing.length === 0 ? "qualifie" : "incomplet";
        await updateDemande(demande.id, { statut, score_completude: score, urgence });

        return {
          demande_id: demande.id,
          statut,
          score_completude: score,
          champs_manquants: missing,
          urgence,
          pret_pour_devis: missing.length === 0,
        };
      },
    }),

    lookup_matrices: tool({
      description: "Consulte les coefficients tarifaires applicables (saison, urgence, capacité).",
      inputSchema: z.object({
        mois: z.number().min(0).max(11).optional(),
        nb_passagers: z.number().optional(),
        urgence_code: z.string().optional(),
      }),
      execute: async (input) => {
        const mois = input.mois ?? new Date().getMonth();
        const saison = SAISON_PAR_MOIS[mois];
        const capacite = input.nb_passagers
          ? getCapaciteCoefficient(input.nb_passagers)
          : null;
        const urgence = input.urgence_code
          ? URGENCE_CODES[input.urgence_code as keyof typeof URGENCE_CODES]
          : null;

        await logAction("lookup_matrices", input);
        return { saison, capacite, urgence, note: "Le prix final est calculé par calculer_devis uniquement." };
      },
    }),

    calculer_devis: tool({
      description:
        "CALCUL DÉTERMINISTE du devis. Seul outil autorisé pour obtenir un prix. Ne jamais estimer manuellement.",
      inputSchema: z.object({
        demande_id: z.string(),
        nb_passagers: z.number(),
        date_depart: z.string(),
        distance_km: z.number(),
        options: z.array(z.string()).optional(),
        nb_jours: z.number().optional(),
        nb_nuits_chauffeur: z.number().optional(),
      }),
      execute: async (input) => {
        const result = calculerDevis({
          nb_passagers: input.nb_passagers,
          date_depart: input.date_depart,
          date_demande: formatISO(new Date(), { representation: "date" }),
          distance_km: input.distance_km,
          options: input.options,
          nb_jours: input.nb_jours,
          nb_nuits_chauffeur: input.nb_nuits_chauffeur,
        });

        await logAction("calculer_devis", { ...input, prix_ttc: result.prix_ttc }, input.demande_id);

        if (result.escalade) {
          await updateDemande(input.demande_id, {
            statut: "cas_complexe",
            cas_complexe: true,
            motif_complexe: result.motif,
          });
        }

        return result;
      },
    }),

    generer_devis: tool({
      description: "Génère le devis PDF (HTML) et l'enregistre en base après calcul réussi.",
      inputSchema: z.object({
        demande_id: z.string(),
        prix_ht: z.number(),
        tva: z.number(),
        prix_ttc: z.number(),
        lignes: z.array(z.object({ libelle: z.string(), montant: z.number() })),
        coefficients: z
          .array(z.object({ code: z.string(), libelle: z.string(), valeur: z.number() }))
          .optional(),
      }),
      execute: async (input) => {
        const demande = await getDemande(input.demande_id);
        if (!demande) return { erreur: "Demande introuvable" };

        const devisData = {
          demande_id: input.demande_id,
          prix_ht: input.prix_ht,
          tva: input.tva,
          prix_ttc: input.prix_ttc,
          lignes: input.lignes,
          coefficients: input.coefficients ?? [],
          devise: "EUR" as const,
          statut: "envoye" as const,
          envoye_at: new Date().toISOString(),
        };

        const devis = await createDevis(devisData);
        const text = generateDevisText(demande, devis);
        await updateDemande(input.demande_id, { statut: "devis_envoye" });

        return {
          devis_id: devis.id,
          prix_ttc: devis.prix_ttc,
          pdf_url: `/api/devis/${devis.id}/pdf`,
          apercu_texte: text.slice(0, 500),
          message: `Devis ${devis.id.slice(0, 8)} généré. TTC : ${devis.prix_ttc.toFixed(2)} €`,
        };
      },
    }),

    planifier_relance: tool({
      description: "Planifie les relances email (J+2 urgent, J+3/J+7 standard). En démo : délais raccourcis.",
      inputSchema: z.object({
        demande_id: z.string(),
        email: z.string(),
        urgence: z.enum(["DD_PRIORITAIRE", "DD_URGENT", "DD_NORMAL", "DD_3MOISETPLUS"]),
      }),
      execute: async (input) => {
        const isDemo = process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development";
        const isUrgent =
          input.urgence === "DD_PRIORITAIRE" || input.urgence === "DD_URGENT";

        const delai1 = isDemo ? 2 : isUrgent ? 2 : 3;
        const delai2 = isDemo ? 4 : 7;
        const unit = isDemo ? "minutes" : "days";

        const date1 = addDays(new Date(), isDemo ? 0 : delai1);
        const date2 = addDays(new Date(), isDemo ? 0 : delai1 + delai2);

        if (isDemo) {
          date1.setMinutes(date1.getMinutes() + 2);
          date2.setMinutes(date2.getMinutes() + 4);
        }

        const r1 = await createRelance({
          demande_id: input.demande_id,
          numero: 1,
          date_prevue: date1.toISOString(),
          statut: "en_attente",
          email_destinataire: input.email,
        });

        const r2 = await createRelance({
          demande_id: input.demande_id,
          numero: 2,
          date_prevue: date2.toISOString(),
          statut: "en_attente",
          email_destinataire: input.email,
        });

        return {
          relance_1: { id: r1.id, date: r1.date_prevue, delai: `${delai1} ${unit}` },
          relance_2: { id: r2.id, date: r2.date_prevue, delai: `${delai1 + delai2} ${unit}` },
          note: isDemo
            ? "Mode démo : relances dans 2 et 4 minutes. Production : J+2/J+3/J+7."
            : "Relances planifiées selon règles métier.",
        };
      },
    }),

    escalader_humain: tool({
      description: "Transfère un cas complexe à un commercial humain avec le contexte.",
      inputSchema: z.object({
        demande_id: z.string(),
        motif: z.string(),
      }),
      execute: async (input) => {
        await updateDemande(input.demande_id, {
          statut: "cas_complexe",
          cas_complexe: true,
          motif_complexe: input.motif,
        });
        await logAction("escalade_humain", input, input.demande_id);
        return {
          statut: "cas_complexe",
          message:
            "Votre demande a été transmise à un conseiller NeoTravel qui vous contactera sous 24h.",
          motif: input.motif,
        };
      },
    }),
  };
}
