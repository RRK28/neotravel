import { APIRequestContext, expect } from "@playwright/test";
import { E2E_SECRET } from "../playwright.config";

export async function resetData(request: APIRequestContext) {
  const res = await request.post("/api/test/helpers", {
    headers: { "x-e2e-secret": E2E_SECRET },
    data: { action: "reset" },
  });
  if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

export const COMPLETE_QUOTE_MSG =
  "Bonjour, je souhaite un devis pour 35 personnes de Paris à Lyon le 15/07/2026, environ 460 km. Email : e2e@neotravel.test";

export const INCOMPLETE_MSG = "Bonjour, je voudrais un transport de Paris à Lyon";

export const COMPLEX_MSG =
  "Devis pour 90 personnes de Paris à Lyon le 15/07/2026, 460 km, email complexe@neotravel.test";

export async function openChat(page: import("@playwright/test").Page) {
  await page.goto("/chat?demo=1");
  await expect(page.getByTestId("chat-input")).toBeVisible();
}

export async function sendChatMessage(page: import("@playwright/test").Page, text: string) {
  const input = page.getByTestId("chat-input");
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/chat") && res.status() === 200,
    { timeout: 30_000 },
  );
  await input.fill(text);
  await page.getByTestId("chat-send").click();
  await responsePromise;
  await page.waitForTimeout(800);
}

export async function waitForAssistantText(
  page: import("@playwright/test").Page,
  pattern: RegExp,
) {
  await expect(
    page.getByTestId("assistant-message").getByText(pattern).last(),
  ).toBeVisible({ timeout: 15_000 });
}
