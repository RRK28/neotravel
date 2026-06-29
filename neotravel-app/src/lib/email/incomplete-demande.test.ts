import { beforeEach, describe, expect, it, vi } from "vitest";
import * as memoryStore from "@/lib/db/memory-store";
import { createDemande, resetStore } from "@/lib/db/memory-store";
import {
  notifyDemandeIncompleteIfNeeded,
  shouldNotifyIncomplete,
} from "@/lib/email/incomplete-demande";

vi.mock("@/lib/email/notifications", () => ({
  sendDemandeIncompleteEmail: vi.fn().mockResolvedValue({ ok: true, simulated: true }),
  buildDevisFormUrl: vi.fn().mockReturnValue("http://localhost:3000/devis"),
}));

import { sendDemandeIncompleteEmail } from "@/lib/email/notifications";

describe("shouldNotifyIncomplete", () => {
  it("refuse sans email ou sans champs manquants", () => {
    const demande = { email: undefined } as Parameters<typeof shouldNotifyIncomplete>[0];
    expect(shouldNotifyIncomplete(demande, ["ville_depart"])).toBe(false);
    expect(shouldNotifyIncomplete({ email: "a@b.com" } as Parameters<typeof shouldNotifyIncomplete>[0], [])).toBe(false);
  });

  it("autorise la première notification", () => {
    const demande = { email: "a@b.com" } as Parameters<typeof shouldNotifyIncomplete>[0];
    expect(shouldNotifyIncomplete(demande, ["date_depart", "nb_passagers"])).toBe(true);
  });

  it("bloque si les mêmes champs manquants", () => {
    const demande = {
      email: "a@b.com",
      email_incomplet_champs: ["date_depart", "nb_passagers"],
    } as Parameters<typeof shouldNotifyIncomplete>[0];
    expect(shouldNotifyIncomplete(demande, ["nb_passagers", "date_depart"])).toBe(false);
  });

  it("autorise si la liste des champs manquants change", () => {
    const demande = {
      email: "a@b.com",
      email_incomplet_champs: ["date_depart"],
    } as Parameters<typeof shouldNotifyIncomplete>[0];
    expect(shouldNotifyIncomplete(demande, ["date_depart", "nb_passagers"])).toBe(true);
  });
});

describe("notifyDemandeIncompleteIfNeeded", () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
  });

  it("envoie une fois et enregistre les champs notifiés", async () => {
    const updateSpy = vi.spyOn(memoryStore, "updateDemande");

    const demande = await createDemande({
      email: "client@example.com",
      ville_depart: "Paris",
      ville_arrivee: "Lyon",
      statut: "incomplet",
    });

    const first = await notifyDemandeIncompleteIfNeeded(demande, ["date_depart", "nb_passagers"]);
    expect(first.sent).toBe(true);
    expect(sendDemandeIncompleteEmail).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(
      demande.id,
      expect.objectContaining({
        email_incomplet_champs: ["date_depart", "nb_passagers"],
      }),
    );

    const second = await notifyDemandeIncompleteIfNeeded(
      { ...demande, email_incomplet_champs: ["date_depart", "nb_passagers"] },
      ["date_depart", "nb_passagers"],
    );
    expect(second.sent).toBe(false);
    expect(sendDemandeIncompleteEmail).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
  });
});
