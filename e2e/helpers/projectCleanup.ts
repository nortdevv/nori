/**
 * Deletes a project via the same chat API the app uses (STATIC_USER_ID),
 * so E2E runs do not leave "E2E …" rows in the dashboard.
 */
/// <reference types="node" />
import type { Page } from "@playwright/test";

const CHAT_BASE =
  process.env.VITE_CHAT_SERVICE_URL ||
  process.env.NORI_CHAT_URL ||
  "http://localhost:3001";

const STATIC_USER_ID =
  process.env.NORI_STATIC_USER_ID ||
  "550e8400-e29b-41d4-a716-446655440000";

export function projectIdFromChatUrl(url: string): string | null {
  const m = url.match(/\/chat\/([0-9a-f-]+)/i);
  return m ? m[1]! : null;
}

export async function deleteTestProject(projectId: string | null): Promise<void> {
  if (!projectId) return;
  const base = CHAT_BASE.replace(/\/$/, "");
  try {
    const res = await fetch(
      `${base}/api/chat/conversations/${encodeURIComponent(projectId)}/delete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: STATIC_USER_ID }),
      },
    );
    if (!res.ok) {
      console.warn(`E2E cleanup: DELETE project ${projectId} → HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`E2E cleanup: project ${projectId}`, err);
  }
}

/** After a chat page visit — fallback if you already have the URL. */
export async function cleanupProjectFromPageUrl(pageUrl: string): Promise<void> {
  await deleteTestProject(projectIdFromChatUrl(pageUrl));
}

/**
 * Creates a project through the UI and returns projectId from the API response,
 * so cleanup can run even if navigation to /chat/:id fails.
 */
export async function createProjectViaUi(
  page: Page,
  name: string,
): Promise<string> {
  await page.goto("/crear");
  await page.getByPlaceholder("Ej: Sistema de Gestión de Inventario").fill(name);

  const responsePromise = page.waitForResponse(
    (r) =>
      r.url().includes("/api/chat/conversations") &&
      !r.url().includes("/delete") &&
      r.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Crear Proyecto" }).click();

  const res = await responsePromise;
  if (!res.ok()) {
    throw new Error(`E2E: crear proyecto → HTTP ${res.status}`);
  }
  const body = (await res.json()) as { projectId?: string };
  if (!body.projectId) {
    throw new Error("E2E: respuesta sin projectId");
  }
  return body.projectId;
}
