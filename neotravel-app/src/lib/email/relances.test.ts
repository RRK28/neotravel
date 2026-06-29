import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDemande,
  createDevis,
  createRelance,
  listRelances,
  resetStore,
  updateDemande,
} from "@/lib/db/memory-store";
import { annulerRelancesDemande, planifierRelancesDemande, processRelancesDue } from "@/lib/email/relances";

vi.mock("@/lib/email/notifications", () => ({
  sendRelanceEmail: vi.fn().mockResolvedValue({ ok: true, simulated: true }),
}));

describe("planifierRelancesDemande", () => {
  beforeEach(async () => {
    await resetStore();
  });

  it("planifie J+2 et J+7 en production", async () => {
    vi.stubEnv("DEMO_MODE", "false");

    const demande = await createDemande({ email: "test@example.com" });
    const t0 = Date.now();
    await planifierRelancesDemande(demande.id, "test@example.com");

    const relances = (await listRelances()).sort((a, b) => a.numero - b.numero);
    expect(relances).toHaveLength(2);

    const j2 = new Date(relances[0]!.date_prevue).getTime() - t0;
    const j7 = new Date(relances[1]!.date_prevue).getTime() - t0;
    expect(j2).toBeGreaterThan(1.9 * 24 * 60 * 60 * 1000);
    expect(j2).toBeLessThan(2.1 * 24 * 60 * 60 * 1000);
    expect(j7).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
    expect(j7).toBeLessThan(7.1 * 24 * 60 * 60 * 1000);

    vi.unstubAllEnvs();
  });

  it("planifie +2 min et +7 min en mode démo", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T10:00:00.000Z"));
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NODE_ENV", "development");

    const demande = await createDemande({ email: "test@example.com" });
    await planifierRelancesDemande(demande.id, "test@example.com");

    const relances = (await listRelances()).sort((a, b) => a.numero - b.numero);
    expect(relances[0]?.date_prevue).toBe("2026-07-01T10:02:00.000Z");
    expect(relances[1]?.date_prevue).toBe("2026-07-01T10:07:00.000Z");

    vi.useRealTimers();
    vi.unstubAllEnvs();
  });
});

describe("annulerRelancesDemande", () => {
  beforeEach(async () => {
    await resetStore();
  });

  it("annule les relances en_attente d'une demande", async () => {
    const demande = await createDemande({ email: "test@example.com" });
    await createRelance({
      demande_id: demande.id,
      numero: 1,
      date_prevue: new Date().toISOString(),
      statut: "en_attente",
      email_destinataire: "test@example.com",
    });
    await createRelance({
      demande_id: demande.id,
      numero: 2,
      date_prevue: new Date().toISOString(),
      statut: "en_attente",
      email_destinataire: "test@example.com",
    });

    const count = await annulerRelancesDemande(demande.id);
    const relances = await listRelances();

    expect(count).toBe(2);
    expect(relances.every((r) => r.statut === "annulee")).toBe(true);
  });

  it("est déclenché quand le statut passe à accepte", async () => {
    const demande = await createDemande({ email: "test@example.com" });
    await createRelance({
      demande_id: demande.id,
      numero: 1,
      date_prevue: new Date().toISOString(),
      statut: "en_attente",
      email_destinataire: "test@example.com",
    });

    await updateDemande(demande.id, { statut: "accepte" });
    const relances = await listRelances();

    expect(relances[0]?.statut).toBe("annulee");
  });
});

describe("processRelancesDue", () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
  });

  it("ignore et annule les relances pour une demande clôturée", async () => {
    const demande = await createDemande({
      email: "test@example.com",
      statut: "cloture",
      ville_depart: "Paris",
      ville_arrivee: "Lyon",
    });
    await createDevis({
      demande_id: demande.id,
      statut: "envoye",
      prix_ht: 1000,
      tva: 200,
      prix_ttc: 1200,
      lignes: [],
      coefficients: [],
      devise: "EUR",
    });
    const past = new Date(Date.now() - 60_000).toISOString();
    await createRelance({
      demande_id: demande.id,
      numero: 1,
      date_prevue: past,
      statut: "en_attente",
      email_destinataire: "test@example.com",
    });

    const results = await processRelancesDue();
    const relances = await listRelances();

    expect(results).toHaveLength(1);
    expect(results[0]?.email_sent).toBe(false);
    expect(results[0]?.statut).toBe("annulee");
    expect(relances[0]?.statut).toBe("annulee");
  });
});
