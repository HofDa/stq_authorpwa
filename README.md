# SouthTyrolQuests Author PWA

Mobile-first Progressive Web App for authoring SouthTyrolQuests tours in the field.

Produces JSON files (and images) that the SouthTyrolQuests Flutter app consumes unchanged. The Flutter app is the player; this PWA is the editor.

See [../southtyrolquests/docs/author_pwa_plan.md](../southtyrolquests/docs/author_pwa_plan.md) for the full roadmap.

## Stack

- Vite + React + TypeScript
- vite-plugin-pwa (installable, offline)
- Tailwind CSS with design tokens mirrored from the Flutter theme
- react-hook-form + zod for forms and JSON-contract validation
- Dexie (IndexedDB) for local draft and blob storage
- JSZip for ZIP export (Phase 1 follow-up)

## Commands

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run build      # production build
npm run preview    # preview built output
npm run typecheck  # tsc --noEmit
```

## Current status (Phase 1 skeleton)

Implemented:

- Scaffolding, design tokens, Tailwind setup
- Tour/Riddle schema + TS types (Zod)
- Dexie draft storage
- Tour list, metadata form (EN/DE/IT), station list + editor
- Content block editor for `paragraph`, `heading`, `image` (placeholder), `line`
- Phone-frame preview shell

Deferred to follow-ups:

- Camera capture + WebP resize pipeline
- ZIP export
- Drag-to-reorder for stations
- GPS auto-fill button
