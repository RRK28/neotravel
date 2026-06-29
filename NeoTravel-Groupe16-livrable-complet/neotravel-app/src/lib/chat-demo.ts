export interface ParsedDemande {
  ville_depart?: string;
  ville_arrivee?: string;
  date_depart?: string;
  nb_passagers?: number;
  distance_km?: number;
  email?: string;
  type_client?: string;
}

export function parseMessage(text: string): ParsedDemande {
  const lower = text.toLowerCase();
  const paxMatch = text.match(/(\d+)\s*(personnes|passagers|pax)/i);
  const kmMatch = text.match(/(\d+)\s*km/i);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const dateMatch = text.match(/(\d{1,2})[\/\s](\d{1,2})[\/\s](\d{4})/);
  const trajetMatch = text.match(/de\s+([A-Za-zÀ-ÿ\s-]+?)\s+(?:à|a|vers)\s+([A-Za-zÀ-ÿ\s-]+?)(?:\s|,|\.|$)/i);

  let date_depart: string | undefined;
  if (dateMatch) {
    date_depart = `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`;
  }

  return {
    nb_passagers: paxMatch ? parseInt(paxMatch[1], 10) : undefined,
    distance_km: kmMatch ? parseInt(kmMatch[1], 10) : undefined,
    email: emailMatch?.[0],
    ville_depart: trajetMatch?.[1]?.trim(),
    ville_arrivee: trajetMatch?.[2]?.trim(),
    date_depart,
    type_client: lower.includes("entreprise") ? "entreprise" : "particulier",
  };
}

export function mergeDemande(prev: ParsedDemande, next: ParsedDemande): ParsedDemande {
  return {
    type_client: next.type_client ?? prev.type_client,
    email: next.email ?? prev.email,
    ville_depart: next.ville_depart ?? prev.ville_depart,
    ville_arrivee: next.ville_arrivee ?? prev.ville_arrivee,
    date_depart: next.date_depart ?? prev.date_depart,
    nb_passagers: next.nb_passagers ?? prev.nb_passagers,
    distance_km: next.distance_km ?? prev.distance_km,
  };
}

export function champsManquants(d: ParsedDemande): string[] {
  const labels: Record<string, string> = {
    email: "votre email",
    ville_depart: "la ville de départ",
    ville_arrivee: "la ville d'arrivée",
    date_depart: "la date de départ",
    nb_passagers: "le nombre de passagers",
    distance_km: "la distance estimée (km)",
  };
  const keys = ["email", "ville_depart", "ville_arrivee", "date_depart", "nb_passagers", "distance_km"] as const;
  return keys.filter((k) => !d[k]).map((k) => labels[k]);
}

export function calculerDevisSimple(d: ParsedDemande): { ht: number; ttc: number } | { escalade: string } {
  const pax = d.nb_passagers!;
  const km = d.distance_km!;
  if (pax > 85) return { escalade: "Groupe de plus de 85 passagers — un conseiller reprend le dossier." };
  if (km > 800) return { escalade: "Trajet supérieur à 800 km — étude manuelle requise." };
  const base = Math.max(450, km * 2.5);
  const coef = pax > 50 ? 1.08 : 1;
  const ht = Math.round(base * coef * 100) / 100;
  const ttc = Math.round(ht * 1.2 * 100) / 100;
  return { ht, ttc };
}

export function buildReply(d: ParsedDemande, missing: string[]): string {
  if (missing.length > 0) {
    return `Merci pour ces informations. Il me manque encore : ${missing.join(", ")}.\n\nPouvez-vous me les préciser ?`;
  }

  const result = calculerDevisSimple(d);
  if ("escalade" in result) {
    return `${result.escalade}\n\nUn commercial NeoTravel vous contactera sous 24 h.`;
  }

  return `Votre demande est complète.

Trajet : ${d.ville_depart} → ${d.ville_arrivee}
${d.nb_passagers} passagers, ${d.distance_km} km

Devis TTC estimé : ${result.ttc.toFixed(2)} €

Le détail complet vous sera envoyé par e-mail.`;
}
