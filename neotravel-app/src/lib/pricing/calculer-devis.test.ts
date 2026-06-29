import { describe, expect, it } from "vitest";
import { calculerDevis, determinerUrgence } from "./calculer-devis";

describe("determinerUrgence", () => {
  it("prioritaire si départ dans moins de 7 jours", () => {
    expect(determinerUrgence(new Date("2026-06-01"), new Date("2026-06-05"))).toBe(
      "DD_PRIORITAIRE",
    );
  });

  it("anticipation si départ dans plus de 90 jours", () => {
    expect(determinerUrgence(new Date("2026-01-01"), new Date("2026-06-01"))).toBe(
      "DD_3MOISETPLUS",
    );
  });
});

describe("calculerDevis — golden cases", () => {
  it("cas typique Paris → Lyon (E2E)", () => {
    const r = calculerDevis({
      nb_passagers: 35,
      date_depart: "2026-07-15",
      date_demande: "2026-06-29",
      distance_km: 460,
    });
    expect(r.erreur).toBeUndefined();
    expect(r.escalade).toBeUndefined();
    expect(r.prix_ttc).toBe(1520.21);
    expect(r.prix_ht).toBe(1382.01);
  });

  it("petit groupe basse saison", () => {
    const r = calculerDevis({
      nb_passagers: 15,
      date_depart: "2026-01-20",
      date_demande: "2026-01-01",
      distance_km: 120,
    });
    expect(r.prix_ttc).toBe(477.79);
  });

  it("gros groupe avec options guide + péages", () => {
    const r = calculerDevis({
      nb_passagers: 70,
      date_depart: "2026-05-10",
      date_demande: "2026-03-01",
      distance_km: 300,
      options: ["guide", "peages"],
      nb_jours: 2,
    });
    expect(r.prix_ttc).toBe(1699.05);
  });

  it("limite haute 85 passagers — calcul OK", () => {
    const r = calculerDevis({
      nb_passagers: 85,
      date_depart: "2026-08-01",
      date_demande: "2026-06-01",
      distance_km: 400,
    });
    expect(r.prix_ttc).toBe(1564.68);
    expect(r.escalade).toBeUndefined();
  });
});

describe("calculerDevis — edge cases", () => {
  it("> 85 passagers → escalade HITL", () => {
    const r = calculerDevis({
      nb_passagers: 86,
      date_depart: "2026-08-01",
      date_demande: "2026-06-01",
      distance_km: 400,
    });
    expect(r.escalade).toBe(true);
    expect(r.prix_ttc).toBe(0);
    expect(r.motif).toMatch(/85 passagers/);
  });

  it("> 800 km → escalade HITL", () => {
    const r = calculerDevis({
      nb_passagers: 40,
      date_depart: "2026-08-01",
      date_demande: "2026-06-01",
      distance_km: 801,
    });
    expect(r.escalade).toBe(true);
    expect(r.motif).toMatch(/800 km/);
  });

  it("0 passager → erreur", () => {
    const r = calculerDevis({
      nb_passagers: 0,
      date_depart: "2026-08-01",
      distance_km: 100,
    });
    expect(r.erreur).toMatch(/passagers invalide/);
  });

  it("même entrée → même prix (déterminisme)", () => {
    const params = {
      nb_passagers: 35,
      date_depart: "2026-07-15",
      date_demande: "2026-06-29",
      distance_km: 460,
    };
    expect(calculerDevis(params).prix_ttc).toBe(calculerDevis(params).prix_ttc);
  });
});
