import { expect, type Page } from "@playwright/test";

/**
 * Opens home and waits until the project library is interactive (post-auth, post-load).
 * Prefer this over "Bienvenido" — the hero is hidden while projects are loading.
 */
export async function gotoDashboardReady(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  await expect(page.getByPlaceholder("Buscar proyectos...")).toBeVisible({
    timeout: 30_000,
  });
}
