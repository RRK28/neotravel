import { test, expect } from "@playwright/test";
import {
  resetData,
  COMPLETE_QUOTE_MSG,
  INCOMPLETE_MSG,
  COMPLEX_MSG,
  sendChatMessage,
  waitForAssistantText,
  openChat,
} from "./helpers";

test.describe("Parcours devis (mode démo)", () => {
  test.beforeEach(async ({ request, page }) => {
    await resetData(request);
    await openChat(page);
  });

  test("demande complète → devis TTC généré", async ({ page, request }) => {
    await sendChatMessage(page, COMPLETE_QUOTE_MSG);
    await waitForAssistantText(page, /Devis TTC/i);

    const admin = await request.get("/api/admin");
    const data = await admin.json();
    expect(data.stats.devis_generes).toBeGreaterThanOrEqual(1);
    expect(data.stats.leads_recus).toBeGreaterThanOrEqual(1);
    expect(data.demandes[0].statut).toBe("devis_envoye");
  });

  test("demande incomplète → champs manquants demandés", async ({ page }) => {
    await sendChatMessage(page, INCOMPLETE_MSG);
    await waitForAssistantText(page, /Il me manque encore|complétude/i);
    await expect(page.getByText(/email|distance|passagers|date/i).last()).toBeVisible();
  });

  test("cas complexe > 85 passagers → escalade humaine", async ({ page, request }) => {
    await sendChatMessage(page, COMPLEX_MSG);
    await waitForAssistantText(page, /nécessite l'intervention|conseiller/i);

    const admin = await request.get("/api/admin");
    const data = await admin.json();
    expect(data.demandes[0].statut).toBe("cas_complexe");
  });
});
