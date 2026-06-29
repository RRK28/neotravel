import { test, expect } from "@playwright/test";
import { resetData } from "./helpers";

test.describe("Landing", () => {
  test.beforeEach(async ({ request }) => {
    await resetData(request);
  });

  test("affiche l'accueil et les liens", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /votre autocariste en 24 h/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /qui sommes-nous/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /devis/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /admin/i }).first()).toBeVisible();
  });

  test("navigation vers le formulaire devis", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /formulaire détaillé/i }).first().click();
    await expect(page).toHaveURL(/\/devis/);
    await expect(
      page.getByRole("heading", { name: /demandez votre devis/i }),
    ).toBeVisible();
  });

  test("navigation vers le chat devis", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /obtenir mon devis/i }).first().click();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByRole("heading", { name: /parler à un conseiller/i })).toBeVisible();
  });

  test("navigation vers qui sommes-nous", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation").getByRole("link", { name: /qui sommes-nous/i }).click();
    await expect(page).toHaveURL(/\/qui-sommes-nous/);
    await expect(page.getByRole("heading", { name: /qui sommes-nous/i }).first()).toBeVisible();
  });
});
