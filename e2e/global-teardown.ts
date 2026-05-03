import { readFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { deleteUsersByEmails } from "../../nori-demo/tests/helpers/dbCleanup.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Removes Playwright global-setup user from DB when DATABASE_URL / NORI_INTEGRATION_DB_URL
 * matches auth-service (only @nori.dev / @nori.test emails).
 */
export default async function globalTeardown(): Promise<void> {
  const metaPath = path.join(__dirname, ".auth", "setup-meta.json");
  if (!existsSync(metaPath)) return;
  try {
    const raw = readFileSync(metaPath, "utf8");
    const { emails } = JSON.parse(raw) as { emails?: string[] };
    if (emails?.length) {
      await deleteUsersByEmails(emails);
    }
  } catch (err) {
    console.warn("E2E globalTeardown:", err);
  } finally {
    try {
      unlinkSync(metaPath);
    } catch {
      /* ignore */
    }
  }
}
