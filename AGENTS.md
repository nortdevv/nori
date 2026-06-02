# AGENTS.md

Guidance for AI coding agents and contributors working in **`nori/`** (frontend).

Backend: sibling **`nori-demo/`** — see [nori-demo/AGENTS.md](../nori-demo/AGENTS.md) and [SETUP.md](../nori-demo/SETUP.md).

## Commands

```bash
npm run dev              # Vite (default http://localhost:5173)
npm run build            # tsc + production bundle
npm run lint             # ESLint
npm run preview          # Serve production build

npm run test:e2e         # Playwright (starts Vite via playwright.config)
npm run test:e2e:install # Chromium (first time)
npm run test:e2e:ui      # Playwright UI mode
```

**E2E** needs auth service for `e2e/global-setup.ts`. Optional: `NORI_E2E_EMAIL`, `NORI_E2E_PASSWORD`. Catalog: [docs/planes/plan-pruebas-40.md](../docs/planes/plan-pruebas-40.md).

## Environment

`.env.local` (defaults in `src/config/api.ts`):

```
VITE_AUTH_SERVICE_URL=http://localhost:3003
VITE_CHAT_SERVICE_URL=http://localhost:3001
VITE_DOCUMENT_SERVICE_URL=http://localhost:3004
```

## Authentication

- **Login:** `Login.tsx` → `AuthProvider` → `authApi.login`. Token in `localStorage` (`nori_token`), user in `nori_user`.
- **Routes:** `ProtectedRoute` checks `nori_auth`; saves `from` for post-login redirect.
- **API:** `apiFetch` sends `Authorization: Bearer` when `nori_token` exists (`src/services/api.ts`).

## Routing

`src/App.tsx`. Public: `/login`, `/logout`.

| Path | Page | Purpose |
|------|------|---------|
| `/` | `Home` | Project list |
| `/perfil` | `Perfil` | User profile |
| `/crear` | `CrearProyecto` | New project |
| `/:id` | `DetalleProyecto` | Detail, versions, export, share modal |
| `/chat/:id` | `Chat` | Chat + document panel |
| `/share/:shareId` | `ShareProjectPage` | Preview / copy shared project |
| `/doc/:projectId/:versionId` | `DocumentVersionView` | Read-only version |
| `/detalle/proyecto` | `Home` | Legacy alias |
| `*` | — | Redirect `/` |

## Key patterns

### Chat (`src/pages/Chat.tsx`)

Left: chat. Right: **DocumentPanel** (sections 0–10, 5 per page). After each reply, if `documentSectionUpdated !== null`, refetch via `chatApi.getDocumentSections`. Progress = sections 1–10; 100% unlocks diagram generation.

### Sections

`DocSectionItem` → `SectionContent` / `SectionEditForm` + `useSectionEdit`. **`LABEL_MAP`** must stay in sync in both content and edit components.

### API clients (`src/services/api.ts`)

- **`authApi`** — login
- **`chatApi`** — conversations, history, send, sections, diagrams
- **`documentApi`** — DOCX blob, HTML preview URL, patch section, versions, email
- **`shareApi`** — create/list/revoke shares, preview, copy

`documentApi.generateDocument` uses raw `fetch` for blob download.

### Document preview (`DetalleProyecto`)

Iframe `src` = `documentApi.previewUrl` immediately; DOCX blob loads in parallel for download.
