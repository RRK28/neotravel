export type TypeTrajet = "aller_simple" | "aller_retour";
export type TypeClientForm = "particulier" | "entreprise";

export interface DevisFormData {
  type_trajet: TypeTrajet;
  nb_passagers: number;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  date_retour: string;
  commentaire: string;
  photoName: string;
  type_client: TypeClientForm;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  societe: string;
  consent: boolean;
}

export interface DevisRecap {
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

export const defaultFormData = (): DevisFormData => ({
  type_trajet: "aller_simple",
  nb_passagers: 20,
  ville_depart: "",
  ville_arrivee: "",
  date_depart: "",
  date_retour: "",
  commentaire: "",
  photoName: "",
  type_client: "particulier",
  nom: "",
  prenom: "",
  telephone: "",
  email: "",
  societe: "",
  consent: false,
});

export function formDataFromSearchParams(params: URLSearchParams): Partial<DevisFormData> {
  const partial: Partial<DevisFormData> = {};
  const type = params.get("type_trajet");
  if (type === "aller_simple" || type === "aller_retour") partial.type_trajet = type;
  const pax = params.get("nb_passagers");
  if (pax) {
    const n = parseInt(pax, 10);
    if (!Number.isNaN(n) && n > 0) partial.nb_passagers = n;
  }
  const dep = params.get("ville_depart");
  if (dep) partial.ville_depart = dep;
  const arr = params.get("ville_arrivee");
  if (arr) partial.ville_arrivee = arr;
  const date = params.get("date_depart");
  if (date) partial.date_depart = date;
  const email = params.get("email");
  if (email) partial.email = email;
  const nom = params.get("nom");
  if (nom) partial.nom = nom;
  const prenom = params.get("prenom");
  if (prenom) partial.prenom = prenom;
  const typeClient = params.get("type_client");
  if (typeClient === "particulier" || typeClient === "entreprise") {
    partial.type_client = typeClient;
  }
  return partial;
}
