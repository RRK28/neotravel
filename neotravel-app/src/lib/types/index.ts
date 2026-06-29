export type StatutDemande =
  | "nouveau"
  | "incomplet"
  | "qualifie"
  | "devis_envoye"
  | "relance_1"
  | "relance_2"
  | "accepte"
  | "refuse"
  | "cas_complexe"
  | "cloture";

export type TypeClient = "particulier" | "entreprise" | "collectivite" | "association";

export type UrgenceCode = "DD_PRIORITAIRE" | "DD_URGENT" | "DD_NORMAL" | "DD_3MOISETPLUS";

export interface Demande {
  id: string;
  type_client?: TypeClient;
  nom?: string;
  societe?: string;
  email?: string;
  telephone?: string;
  ville_depart?: string;
  ville_arrivee?: string;
  date_depart?: string;
  date_retour?: string;
  nb_passagers?: number;
  type_trajet?: string;
  distance_km?: number;
  type_vehicule?: string;
  options?: string[];
  commentaire?: string;
  urgence?: UrgenceCode;
  statut: StatutDemande;
  score_completude: number;
  cas_complexe?: boolean;
  motif_complexe?: string;
  created_at: string;
  updated_at: string;
}

export interface LigneDevis {
  libelle: string;
  montant: number;
}

export interface CoefficientApplique {
  code: string;
  libelle: string;
  valeur: number;
}

export interface DevisResult {
  prix_ht: number;
  tva: number;
  prix_ttc: number;
  lignes: LigneDevis[];
  coefficients: CoefficientApplique[];
  devise: "EUR";
  erreur?: string;
  escalade?: boolean;
  motif?: string;
}

export interface Devis extends DevisResult {
  id: string;
  demande_id: string;
  statut: "brouillon" | "envoye" | "accepte" | "refuse";
  pdf_content?: string;
  envoye_at?: string;
  created_at: string;
}

export interface Relance {
  id: string;
  demande_id: string;
  numero: 1 | 2;
  date_prevue: string;
  statut: "en_attente" | "envoyee" | "annulee";
  email_destinataire?: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  demande_id?: string;
  action: string;
  metadata?: Record<string, unknown>;
  tokens_used?: number;
  created_at: string;
}

export interface DashboardStats {
  leads_recus: number;
  devis_generes: number;
  devis_envoyes: number;
  devis_acceptes: number;
  devis_refuses: number;
  relances_en_attente: number;
  demandes_urgentes: number;
  cas_complexes: number;
  delai_moyen_heures: number;
  taux_conversion: number;
}
