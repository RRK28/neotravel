import { test, expect } from "@playwright/test";
import {
  resetData,
  COMPLETE_QUOTE_MSG,
  sendChatMessage,
  waitForAssistantText,
  openChat,
} from "./helpers";

test.describe("Admin", () => {
  test.beforeEach(async ({ request, page }) => {
    await resetData(request);
    await openChat(page);
    await sendChatMessage(page, COMPLETE_QUOTE_MSG);
    await waitForAssistantText(page, /Devis TTC/i);
  });

  test("affiche la demande reçue", async ({ page }) => {
    await page.goto("/admin");

    await expect(page.getByRole("heading", { name: /demandes reçues/i })).toBeVisible();
    await expect(page.getByText("Paris")).toBeVisible();
    await expect(page.getByText("Lyon")).toBeVisible();
    await expect(page.getByText(/Devis TTC/i)).toBeVisible();
    await expect(page.getByText("e2e@neotravel.test")).toBeVisible();
  });

  test("devis PDF accessible", async ({ request }) => {
    const admin = await request.get("/api/admin");
    const data = await admin.json();
    const devisId = data.devis[0]?.id;
    expect(devisId).toBeTruthy();

    const pdfRes = await request.get(`/api/devis/${devisId}/pdf`);
    expect(pdfRes.ok()).toBeTruthy();
    expect(pdfRes.headers()["content-type"]).toContain("application/pdf");
    const body = await pdfRes.body();
    expect(body.subarray(0, 5).toString("ascii")).toBe("%PDF-");

    const htmlRes = await request.get(`/api/devis/${devisId}`);
    expect(htmlRes.ok()).toBeTruthy();
    const html = await htmlRes.text();
    expect(html).toContain("NeoTravel");
    expect(html).toContain("Total TTC");
    expect(html).toContain("Paris");
  });
});
