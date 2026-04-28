# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on port 5173
npm run build     # TypeScript compile + production bundle
npm run lint      # ESLint
npm run preview   # Serve the production build locally
```

## Environment

Create `.env.local` with:
```
VITE_CHAT_SERVICE_URL=http://localhost:3001
VITE_DOCUMENT_SERVICE_URL=http://localhost:3004
```

Both have localhost fallbacks in `src/config/api.ts`. A hardcoded `STATIC_USER_ID` is used throughout — auth is not yet implemented.

## Routing

Defined in `src/App.tsx`:

| Path | Page | Purpose |
|------|------|---------|
| `/` | `Home` | Project list |
| `/crear` | `CrearProyecto` | New project wizard |
| `/:id` | `DetalleProyecto` | Project detail view |
| `/chat/:id` | `Chat` | Main chat + document panel |

## Key Architecture Patterns

### Chat page split layout (`src/pages/Chat.tsx`)

The `Chat` page is the core UI: a left `ChatPanel` for the conversational AI and a right `DocumentPanel` showing 11 proposal sections (0–10), paginated 5 at a time. On every AI reply, if `documentSectionUpdated !== null`, all sections are re-fetched from the backend to stay in sync.

Progress is calculated over sections 1–10 only (section 0 is general requester info). When progress hits 100%, the "Generar Diagrama" button appears.

### Document section rendering pipeline

Section content is JSONB from the backend (can be an object, array, or string). The rendering path:

1. `DocSectionItem` — manages expand/collapse and delegates to `useSectionEdit` hook
2. `SectionContent` — read-only renderer; auto-detects content shape (flat object → key-value table, array of objects → data table, plain array → list, string → paragraph)
3. `SectionEditForm` — editable mirror of `SectionContent`; renders matching inputs per field type (table cells, textareas, inputs, checkboxes, nested objects)

`LABEL_MAP` in both `SectionContent` and `SectionEditForm` maps Spanish snake_case keys to display labels. Keep both files in sync when adding new keys.

### `useSectionEdit` hook (`src/hooks/useSectionEdit.ts`)

Manages edit lifecycle: `idle → editing → saving → saved → idle`. Calls `documentApi.patchSection` on save. The `saved` state auto-resets to `idle` after 2 seconds.

### API client (`src/services/api.ts`)

Two namespaced clients:
- `chatApi` — all chat-service endpoints (conversations, history, send, document-sections, diagrams)
- `documentApi` — document-service endpoints (generate DOCX blob, HTML preview URL, patch section)

`documentApi.previewUrl()` returns a URL string (not a fetch call) used directly as an `<iframe src>`.

### Document preview flow

"Generar Documento" sets the iframe `src` immediately (so the HTML preview loads fast), then fetches the DOCX blob in parallel. The Download button is disabled until the blob is ready.
