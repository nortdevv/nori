import { test, expect } from "@playwright/test";

/**
 * E01, E04–E08 — usuario autenticado (storageState desde global-setup).
 * Requiere: auth, chat y document (y DB) como en desarrollo local.
 *
 * Serial: orden fijo; E04 cierra sesión al final.
 */
test.describe.configure({ mode: "serial" });

test.describe("E01 E04–E08 (autenticado)", () => {
  test("E01: login vía storage — dashboard muestra bienvenida", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Bienvenido/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("E05: crear proyecto y llegar al chat", async ({ page }) => {
    await page.goto("/crear");
    const name = `E2E Proyecto ${Date.now()}`;
    await page.getByPlaceholder("Ej: Sistema de Gestión de Inventario").fill(name);
    await page.getByRole("button", { name: "Crear Proyecto" }).click();
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]+/i, { timeout: 60_000 });
    await expect(page.getByText("Asistente Conversacional")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("E06: abrir proyecto desde home — historial y documento", async ({
    page,
  }) => {
    await page.goto("/crear");
    const name = `E2E Detalle ${Date.now()}`;
    await page.getByPlaceholder("Ej: Sistema de Gestión de Inventario").fill(name);
    await page.getByRole("button", { name: "Crear Proyecto" }).click();
    await expect(page).toHaveURL(/\/chat\//);

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Bienvenido/i }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("article").filter({ hasText: name }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.getByRole("link", { name: /Continuar chat/i }).click();
    await expect(page).toHaveURL(/\/chat\//);
    await expect(page.getByText("Asistente Conversacional")).toBeVisible();
    await expect(page.getByText("Documento de Requerimientos")).toBeVisible();
  });

  test("E07: búsqueda sin resultados muestra estado vacío de filtros", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Bienvenido/i }),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder("Buscar proyectos...").fill("__no_match_xyz_123__");
    await expect(
      page.getByRole("heading", { name: "No encontramos proyectos" }),
    ).toBeVisible();
  });

  test("E08: Generar Documento abre vista previa o error usable", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/crear");
    await page
      .getByPlaceholder("Ej: Sistema de Gestión de Inventario")
      .fill(`E2E Doc ${Date.now()}`);
    await page.getByRole("button", { name: "Crear Proyecto" }).click();
    await expect(page).toHaveURL(/\/chat\//);

    await page.getByRole("button", { name: "Generar Documento" }).click();
    const overlay = page.locator(".doc-preview-overlay");
    const errorText = page.getByText(/Error al generar|No se pudo generar/i);
    await expect(overlay.or(errorText).first()).toBeVisible({ timeout: 90_000 });
  });

  test("E04: cerrar sesión redirige al login", async ({ page }) => {
    await page.goto("/");
    await page.locator("#user-menu-trigger").click();
    await page.locator("#logout-button").click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Iniciar sesión" }),
    ).toBeVisible();
  });
});
