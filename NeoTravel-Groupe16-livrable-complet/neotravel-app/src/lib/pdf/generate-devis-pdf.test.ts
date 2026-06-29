import { describe, expect, it } from "vitest";
import { generateDevisPdf, devisPdfFilename, refCourteDevis } from "./generate-devis-pdf";
import type { Demande, Devis } from "@/lib/types";

const demande: Demande = {
  id: "demande-test-001",
  nom: "Dupont",
  societe: "ACME Voyages",
  email: "client@example.com",
  ville_depart: "Paris",
  ville_arrivee: "Lyon",
  date_depart: "2026-07-15",
  nb_passagers: 35,
  distance_km: 460,
  statut: "devis_envoye",
  score_completude: 100,
  created_at: "2026-06-29T10:00:00.000Z",
  updated_at: "2026-06-29T10:00:00.000Z",
};

const devis: Devis = {
  id: "devis-test-abcdef12",
  demande_id: demande.id,
  statut: "envoye",
  prix_ht: 1382.01,
  tva: 138.2,
  prix_ttc: 1520.21,
  devise: "EUR",
  coefficients: [],
  lignes: [
    { libelle: "Transport autocar 50 places", montant: 1200 },
    { libelle: "Frais de dossier", montant: 182.01 },
  ],
  created_at: "2026-06-29T10:05:00.000Z",
};

describe("generateDevisPdf", () => {
  it("produit un buffer PDF valide", async () => {
    const pdf = await generateDevisPdf(demande, devis);
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("nomme le fichier avec la référence courte", () => {
    expect(refCourteDevis(devis.id)).toBe("DEVIS-TE");
    expect(devisPdfFilename(devis)).toBe("devis-neotravel-DEVIS-TE.pdf");
  });
});
