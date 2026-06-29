import { differenceInCalendarDays, parseISO, isValid } from "date-fns";
import type { CoefficientApplique, DevisResult, LigneDevis, UrgenceCode } from "@/lib/types";
import {
  getCapaciteCoefficient,
  MARGE_TAUX,
  OPTIONS_TARIFS,
  PRICING_HYPOTHESES,
  SAISON_PAR_MOIS,
  TVA_TAUX,
  URGENCE_CODES,
} from "./matrices";

export interface CalculerDevisParams {
  nb_passagers: number;
  date_depart: string;
  date_demande?: string;
  distance_km: number;
  type_vehicule?: string;
  options?: string[];
  nb_jours?: number;
  nb_nuits_chauffeur?: number;
}

export function determinerUrgence(dateDemande: Date, dateDepart: Date): UrgenceCode {
  const jours = differenceInCalendarDays(dateDepart, dateDemande);
  if (jours < 0) return "DD_PRIORITAIRE";
  if (jours <= 7) return "DD_PRIORITAIRE";
  if (jours <= 14) return "DD_URGENT";
  if (jours <= 90) return "DD_NORMAL";
  return "DD_3MOISETPLUS";
}

export function calculerDevis(params: CalculerDevisParams): DevisResult {
  const coefficients: CoefficientApplique[] = [];
  const lignes: LigneDevis[] = [];

  if (params.nb_passagers <= 0) {
    return erreur("Nombre de passagers invalide (minimum 1).");
  }

  if (params.nb_passagers > PRICING_HYPOTHESES.passagers_max_auto) {
    return escalade("Plus de 85 passagers — transmission à un commercial requise.");
  }

  if (params.distance_km <= 0) {
    return erreur("Distance invalide.");
  }

  if (params.distance_km > PRICING_HYPOTHESES.distance_max_auto) {
    return escalade("Trajet hors zone automatique (> 800 km) — validation humaine requise.");
  }

  const dateDepart = parseISO(params.date_depart);
  const dateDemande = params.date_demande ? parseISO(params.date_demande) : new Date();

  if (!isValid(dateDepart)) {
    return erreur("Date de départ invalide.");
  }

  if (differenceInCalendarDays(dateDepart, dateDemande) < 0) {
    return erreur("Date de départ incohérente (antérieure à la date de demande).");
  }

  const baseDistance = Math.max(
    params.distance_km * PRICING_HYPOTHESES.prix_par_km,
    PRICING_HYPOTHESES.prix_minimum,
  );
  lignes.push({
    libelle: `Base transport (${params.distance_km} km × ${PRICING_HYPOTHESES.prix_par_km} €, min. ${PRICING_HYPOTHESES.prix_minimum} €)`,
    montant: round2(baseDistance),
  });

  const saison = SAISON_PAR_MOIS[dateDepart.getMonth()];
  coefficients.push({
    code: saison.code,
    libelle: `Saison ${saison.code}`,
    valeur: saison.coefficient,
  });

  const urgenceCode = determinerUrgence(dateDemande, dateDepart);
  const urgence = URGENCE_CODES[urgenceCode];
  coefficients.push({
    code: urgenceCode,
    libelle: urgence.libelle,
    valeur: urgence.coefficient,
  });

  const capacite = getCapaciteCoefficient(params.nb_passagers);
  coefficients.push({
    code: capacite.code,
    libelle: `Capacité ${params.nb_passagers} passagers`,
    valeur: capacite.coefficient,
  });

  const coeffTotal =
    (1 + saison.coefficient) * (1 + urgence.coefficient) * (1 + capacite.coefficient);

  const montantCoeff = round2(baseDistance * (coeffTotal - 1));
  if (montantCoeff !== 0) {
    lignes.push({
      libelle: "Ajustements saison / urgence / capacité",
      montant: montantCoeff,
    });
  }

  let sousTotal = round2(baseDistance * coeffTotal);

  const options = params.options ?? [];
  const nbJours = params.nb_jours ?? 1;
  const nbNuits = params.nb_nuits_chauffeur ?? 1;

  if (options.includes("guide")) {
    const m = OPTIONS_TARIFS.guide.montant * nbJours;
    lignes.push({ libelle: `${OPTIONS_TARIFS.guide.libelle} (${nbJours} j)`, montant: m });
    sousTotal = round2(sousTotal + m);
  }

  if (options.includes("nuit_chauffeur")) {
    const m = OPTIONS_TARIFS.nuit_chauffeur.montant * nbNuits;
    lignes.push({ libelle: `${OPTIONS_TARIFS.nuit_chauffeur.libelle} (${nbNuits} n)`, montant: m });
    sousTotal = round2(sousTotal + m);
  }

  if (options.includes("peages")) {
    const m = round2(
      Math.min(params.distance_km * PRICING_HYPOTHESES.peages_par_km, PRICING_HYPOTHESES.peages_max),
    );
    lignes.push({ libelle: OPTIONS_TARIFS.peages.libelle, montant: m });
    sousTotal = round2(sousTotal + m);
  }

  const marge = round2(sousTotal * MARGE_TAUX);
  lignes.push({ libelle: `Marge commerciale (${MARGE_TAUX * 100} %)`, montant: marge });

  const prix_ht = round2(sousTotal + marge);
  const tva = round2(prix_ht * TVA_TAUX);
  const prix_ttc = round2(prix_ht + tva);

  lignes.push({ libelle: `TVA (${TVA_TAUX * 100} %)`, montant: tva });

  return {
    prix_ht,
    tva,
    prix_ttc,
    lignes,
    coefficients,
    devise: "EUR",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function erreur(msg: string): DevisResult {
  return {
    prix_ht: 0,
    tva: 0,
    prix_ttc: 0,
    lignes: [],
    coefficients: [],
    devise: "EUR",
    erreur: msg,
  };
}

function escalade(msg: string): DevisResult {
  return {
    ...erreur(msg),
    escalade: true,
    motif: msg,
  };
}
