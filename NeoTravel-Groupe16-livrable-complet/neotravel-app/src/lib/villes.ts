/** Villes reconnues pour l'estimation de trajet (France + Bruxelles). */

export interface Ville {
  key: string;
  label: string;
  lat: number;
  lon: number;
}

export const VILLES: Ville[] = [
  { key: "angers", label: "Angers", lat: 47.4784, lon: -0.5632 },
  { key: "bordeaux", label: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { key: "bruxelles", label: "Bruxelles", lat: 50.8503, lon: 4.3517 },
  { key: "dijon", label: "Dijon", lat: 47.322, lon: 5.0415 },
  { key: "grenoble", label: "Grenoble", lat: 45.1885, lon: 5.7245 },
  { key: "lille", label: "Lille", lat: 50.6292, lon: 3.0573 },
  { key: "lyon", label: "Lyon", lat: 45.764, lon: 4.8357 },
  { key: "marseille", label: "Marseille", lat: 43.2965, lon: 5.3698 },
  { key: "metz", label: "Metz", lat: 49.1193, lon: 6.1757 },
  { key: "montpellier", label: "Montpellier", lat: 43.6108, lon: 3.8767 },
  { key: "nantes", label: "Nantes", lat: 47.2184, lon: -1.5536 },
  { key: "nice", label: "Nice", lat: 43.7102, lon: 7.262 },
  { key: "paris", label: "Paris", lat: 48.8566, lon: 2.3522 },
  { key: "rennes", label: "Rennes", lat: 48.1173, lon: -1.6778 },
  { key: "strasbourg", label: "Strasbourg", lat: 48.5734, lon: 7.7521 },
  { key: "toulouse", label: "Toulouse", lat: 43.6047, lon: 1.4442 },
];

const VILLES_PAR_CLE = new Map(VILLES.map((v) => [v.key, v]));
const VILLES_PAR_LABEL = new Map(VILLES.map((v) => [v.label.toLowerCase(), v]));

export function normaliserVille(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function trouverVille(nom: string): Ville | null {
  const key = normaliserVille(nom);
  if (!key) return null;
  return VILLES_PAR_CLE.get(key) ?? VILLES_PAR_LABEL.get(key) ?? null;
}

export function estVilleConnue(nom: string): boolean {
  return trouverVille(nom) !== null;
}

export function labelVille(nom: string): string {
  return trouverVille(nom)?.label ?? nom.trim();
}

export function coordsVille(ville: string): { lat: number; lon: number } | null {
  const v = trouverVille(ville);
  return v ? { lat: v.lat, lon: v.lon } : null;
}

export function filtrerVilles(recherche: string): Ville[] {
  const q = normaliserVille(recherche);
  if (!q) return VILLES;
  return VILLES.filter(
    (v) => normaliserVille(v.label).includes(q) || v.key.includes(q),
  );
}
