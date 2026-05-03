import { test, expect } from "@playwright/test";

/**
 * E02, E03 — sin sesión (proyecto chromium-guest).
 */
test.describe("E02 E03 (invitado)", () => {
  test("E02: credenciales incorrectas muestran error", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await page.locator("#login-email").fill("no-existe@nori.test");
    await page.locator("#login-password").fill("WrongPass123!");
    await page.locator("#login-submit").click();
    await expect(page.locator("#login-form")).toContainText(/incorrectas|inválid|Credenciales/i, {
      timeout: 15_000,
    });
  });

  test("E03: enlace ¿Olvidaste tu contraseña? es visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#forgot-password")).toBeVisible();
    await expect(page.locator("#forgot-password")).toContainText(/Olvidaste tu contraseña/i);
  });
});
