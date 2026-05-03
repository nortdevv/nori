import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Registers (or logs in) a test user and writes Playwright storageState with Nori localStorage keys.
 */
export default async function globalSetup(): Promise<void> {
  const authBase =
    process.env.VITE_AUTH_SERVICE_URL || "http://localhost:3003";
  const origin = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";

  const email =
    process.env.NORI_E2E_EMAIL || `e2e-${Date.now()}@nori.test`;
  const password = process.env.NORI_E2E_PASSWORD || "E2ETest123!";

  let res = await fetch(`${authBase}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "E2E User" }),
  });

  if (res.status === 409) {
    res = await fetch(`${authBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `E2E globalSetup: auth ${res.status} ${body.slice(0, 200)}. Is auth-service running on ${authBase}?`,
    );
  }

  const { token, user } = (await res.json()) as {
    token: string;
    user: { id: string; email: string; name: string | null; role: string };
  };

  const storage = {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          { name: "nori_auth", value: "true" },
          { name: "nori_token", value: token },
          { name: "nori_user", value: JSON.stringify(user) },
        ],
      },
    ],
  };

  const dir = path.join(__dirname, ".auth");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "user.json"), JSON.stringify(storage, null, 2));
  writeFileSync(
    path.join(dir, "setup-meta.json"),
    JSON.stringify({ emails: [email] }, null, 2),
  );
}
