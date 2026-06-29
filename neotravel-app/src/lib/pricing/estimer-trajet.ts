/** Estimation distance/durée — le client ne fournit pas ces données. */

import { coordsVille } from "@/lib/villes";

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Distance routière estimée (+15 % vs ligne droite). */
export function estimerTrajet(
  villeDepart: string,
  villeArrivee: string,
): { distance_km: number; duree_heures: number } | null {
  const a = coordsVille(villeDepart);
  const b = coordsVille(villeArrivee);
  if (!a || !b) return null;

  const km = Math.round(haversineKm(a, b) * 1.15);
  const duree_heures = Math.round((km / 80) * 10) / 10;
  return { distance_km: km, duree_heures };
}
