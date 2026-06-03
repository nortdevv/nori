# AGENTS.md

Guidance for AI coding agents and contributors working in this repo (`nori/` frontend).

## Commands

```bash
npm run dev            # Vite dev server (default http://localhost:5173)
npm run build          # TypeScript project references + production bundle
npm run lint           # ESLint
npm run preview        # Serve the production build locally
npm run test:e2e       # Playwright (starts Vite via playwright.config)
npm run test:e2e:install   # Install Playwright Chromium browser
npm run test:e2e:ui        # Playwright UI mode
```

## Environment

Create `.env.local` as needed (all keys have localhost defaults in `src/config/api.ts`):

```
VITE_AUTH_SERVICE_URL=http://localhost:3003
VITE_CHAT_SERVICE_URL=http://localhost:3001
VITE_DOCUMENT_SERVICE_URL=http://localhost:3004
```

## Authentication

- **Login UI**: `src/pages/Login.tsx` → `AuthProvider` (`src/context/AuthContext.tsx`) calls `authApi.login`. JWT is stored in `localStorage` under `nori_token`; user JSON under `nori_user`; `nori_auth` flag gates `ProtectedRoute`.
- **API calls**: `src/services/api.ts` does **not** yet attach `Authorization: Bearer …` on `chatApi` / `documentApi` / blob downloads. Backend may still accept requests with a hardcoded `STATIC_USER_ID` in bodies or query params; when services enforce JWT, extend the shared fetch layer to inject the token and handle `401`.
- **Static user id**: `STATIC_USER_ID` in `src/config/api.ts` is still sent on chat/conversation endpoints where the API expects `userId`.

## Routing

Defined in `src/App.tsx`. Public: `/login`, `/logout`. All others are wrapped in `ProtectedRoute`.

| Path | Page | Purpose |
|------|------|---------|
| `/` | `Home` | Project list |
| `/perfil` | `Perfil` | User profile |
| `/crear` | `CrearProyecto` | New project wizard |
| `/:id` | `DetalleProyecto` | Project detail (metadata, versions, export, email) |
| `/chat/:id` | `Chat` | Chat + document sections panel |
| `/doc/:projectId/:versionId` | `DocumentVersionView` | Read-only snapshot of a saved version |
| `/detalle/proyecto` | `Home` | Legacy alias → same as `/` |
| `*` | — | Redirect to `/` |

## Key architecture patterns

### Chat page (`src/pages/Chat.tsx`)

Left: conversational AI. Right: **DocumentPanel** with 11 proposal sections (0–10), paginated 5 at a time. After each AI reply, if `documentSectionUpdated !== null`, sections are re-fetched via `chatApi.getDocumentSections` to stay in sync.

Progress uses sections **1–10** only (section 0 is general requester info). At 100%, **Generar Diagrama** unlocks.

### Document section rendering

Section payloads are JSONB-shaped (object, array, or string). Flow:

1. `DocSectionItem` — expand/collapse; uses `useSectionEdit`
2. `SectionContent` — read-only rendering by shape (key-value, tables, lists, paragraph)
3. `SectionEditForm` — editable mirror of the same shapes

`LABEL_MAP` exists in both `SectionContent` and `SectionEditForm` (Spanish labels for snake_case keys). **Keep them in sync** when adding fields.

### `useSectionEdit` (`src/hooks/useSectionEdit.ts`)

Lifecycle: `idle → editing → saving → saved → idle`. Persists with `documentApi.patchSection`. `saved` resets to `idle` after ~2s.

### API client (`src/services/api.ts`)

- **`authApi`** — login (`/api/auth/login`).
- **`chatApi`** — conversations (list, create, update, delete), history, send message, document sections, diagram generate/get/update.
- **`documentApi`** — DOCX generate (blob), HTML `previewUrl` for iframes, project fetch, `patchSection`, version list/detail/create/delete, send document email.

Helpers: `joinServiceUrl` + `apiFetch` for JSON. **`documentApi.generateDocument`** uses `fetch` directly and returns a `Blob` (not `apiFetch`). Network failures are mapped to Spanish user messages in a few places.

### Document preview (project detail)

**Generar Documento** sets the iframe `src` to `documentApi.previewUrl` immediately, then loads the DOCX blob in parallel; download stays disabled until the blob is ready.

## Backend

The multi-service API this UI targets lives in the sibling **`nori-demo`** repo (auth, chat, document, RAG services). Align `VITE_*` URLs with however those ports are run locally or deployed.
