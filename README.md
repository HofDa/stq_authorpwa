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
npm run dev        # local dev server at http://localhost:5174
npm run build      # production build
npm run preview    # preview built output
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Map Provider

Maps now default to MapLibre through the shared `AuthorMap` boundary.

- `VITE_MAP_PROVIDER=maplibre` keeps the default provider explicit.
- `VITE_MAP_PROVIDER=leaflet` enables the temporary Leaflet fallback.
- `VITE_MAP_STYLE_URL=https://.../style.json` overrides the MapLibre style URL.

If `VITE_MAP_STYLE_URL` is unset, the app falls back to a safe public raster OpenStreetMap style with no API key. For compatibility with the earlier spike, `VITE_MAPLIBRE_STYLE_URL` is still accepted as a fallback env var, but new setup should use `VITE_MAP_STYLE_URL`.

## Current status (Phase 1 working baseline)

Implemented:

- Scaffolding, design tokens, Tailwind setup
- Tour/Riddle schema + TS types (Zod)
- Dexie draft storage
- Tour list, metadata form (EN/DE/IT), station list + editor
- Camera/file capture with WebP crop/resize pipeline
- Content block editor for `paragraph`, `heading`, `image`, `line`
- Phone-frame preview with inline authoring
- GPS auto-fill for station coordinates
- Live route-planning map with GPS tracking and station polyline generation
- ZIP export per draft (`tours.json` + riddles JSON + local images)

Deferred to follow-ups:

- Full drag-and-drop reorder for stations (arrow reorder exists)
- Additional riddle types beyond `text`
- Additional content block types (`paragraph_styled`, `audio`, `chat`)
- Smarter route segmentation and optional road snapping / map matching
