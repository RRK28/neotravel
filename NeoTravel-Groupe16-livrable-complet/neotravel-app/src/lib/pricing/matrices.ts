/**
 * Matrices tarifaires NeoTravel — source : documents projet Interstellabs.
 * Hypothèses documentées pour base distance (non fournie dans les PDF).
 */
export const PRICING_HYPOTHESES = {
  prix_par_km: 2.5,
  prix_minimum: 450,
  peages_par_km: 0.12,
  peages_max: 150,
  distance_max_auto: 800,
  passagers_max_auto: 85,
} as const;

export const SAISON_PAR_MOIS: Record<number, { code: string; coefficient: number }> = {
  0: { code: "BASSE", coefficient: -0.07 },
  1: { code: "BASSE", coefficient: -0.07 },
  2: { code: "HAUTE", coefficient: 0.1 },
  3: { code: "HAUTE", coefficient: 0.1 },
  4: { code: "TRES_HAUTE", coefficient: 0.15 },
  5: { code: "TRES_HAUTE", coefficient: 0.15 },
  6: { code: "HAUTE", coefficient: 0.1 },
  7: { code: "BASSE", coefficient: -0.07 },
  8: { code: "MOYENNE", coefficient: 0 },
  9: { code: "MOYENNE", coefficient: 0 },
  10: { code: "BASSE", coefficient: -0.07 },
  11: { code: "MOYENNE", coefficient: 0 },
};

export const URGENCE_CODES = {
  DD_PRIORITAIRE: { coefficient: 0.1, libelle: "Prioritaire (départ < 7 jours)" },
  DD_URGENT: { coefficient: 0.05, libelle: "Urgent (départ < 14 jours)" },
  DD_NORMAL: { coefficient: -0.05, libelle: "Normal" },
  DD_3MOISETPLUS: { coefficient: -0.1, libelle: "Anticipation (> 90 jours)" },
} as const;

export function getCapaciteCoefficient(nb: number): { code: string; coefficient: number } {
  if (nb <= 19) return { code: "CAP_19", coefficient: -0.05 };
  if (nb <= 53) return { code: "CAP_53", coefficient: 0 };
  if (nb <= 63) return { code: "CAP_63", coefficient: 0.15 };
  if (nb <= 67) return { code: "CAP_67", coefficient: 0.2 };
  if (nb <= 85) return { code: "CAP_85", coefficient: 0.4 };
  return { code: "HORS_CAPACITE", coefficient: 0 };
}

export const OPTIONS_TARIFS = {
  guide: { libelle: "Guide / accompagnateur", montant: 80, unite: "jour" },
  nuit_chauffeur: { libelle: "Nuit chauffeur", montant: 120, unite: "nuit" },
  peages: { libelle: "Péages inclus", forfait: true },
} as const;

export const TVA_TAUX = 0.1;
export const MARGE_TAUX = 0.15;
