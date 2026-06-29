import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "@/lib/db/memory-store";
import { n8nQualifier } from "@/lib/n8n/tool-handlers";

describe("n8nQualifier", () => {
  beforeEach(async () => {
    await resetStore();
  });

  it("parse un texte Paris-Lyon et retourne demande complète", async () => {
    const result = await n8nQualifier({
      text: "Devis pour 35 personnes de Paris à Lyon le 15/07/2026, email demo@neotravel.test",
    });

    expect(result.demande_id).toBeDefined();
    expect(result.pret_pour_devis).toBe(true);
    expect(result.score_completude).toBe(100);
    expect(result.missing).toEqual([]);
    expect(result.distance_km).toBeGreaterThan(0);
  });

  it("signale les champs manquants pour un trajet incomplet", async () => {
    const result = await n8nQualifier({
      text: "Transport de Paris à Lyon",
    });

    expect(result.demande_id).toBeDefined();
    expect(result.pret_pour_devis).toBe(false);
    expect(result.missing?.length).toBeGreaterThan(0);
    expect(result.score_completude).toBeLessThan(100);
  });
});
