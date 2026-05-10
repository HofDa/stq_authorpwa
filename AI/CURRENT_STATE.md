# Current State — SouthTyrolQuests Author PWA

## Stable baseline

- Vite + React + TypeScript app scaffold exists.
- Local draft storage is implemented through Dexie.
- Tour/riddle schema validation exists with Zod and tests.
- Tour list, tour editor, station editor and phone-frame preview exist.
- Map authoring uses MapLibre through the shared author-map boundary.
- ZIP export exists for tours, riddles JSON and local images.
- RRR core and runtime areas exist with boundary and evaluator tests.
- Field-mode assistant/storyline components exist from recent PR work.

## Recent known work from `CHANGED_FILES.txt`

- Field assistant UI was expanded.
- Storyline screen and markdown/reply helpers were added.
- Shared feedback provider was added.
- Speech recognition was consolidated toward `src/hooks/useSpeechDictation.ts`.
- Temporary TypeScript build info files were removed/ignored.
- Map provider cleanup touched `AuthorMap`, `LeafletAuthorMap`, `MapLibreAuthorMap` and map types.

## In progress / likely next areas

- Mobile authoring UX hardening.
- Field assistant workflow refinement.
- RRR authoring UI and runtime bridge improvements.
- Sensor smoothing and real field-test workflows.
- PWA/offline/cache hardening.
- JSON/schema stability checks before deeper riddle-module expansion.

## Current technical cautions

- Map tiles are not fully offline-ready.
- Schema changes can affect the Flutter player app.
- Browser speech recognition behavior varies strongly across browsers and devices.
- Mobile viewport, drawer and keyboard behavior need real-device checks.
- Sensor behavior must be tested on Android devices, not only desktop browsers.

## Recommended next safe PRs

1. Fill and refine the `AI/` project memory files after one manual repo review.
2. Add a focused `AI/RUNTIME_RULES.md` for RRR module development.
3. Add a focused `AI/MOBILE_QA.md` for mobile field-testing checks.
4. Add a focused `AI/PWA_CACHE_RULES.md` before service-worker work.
5. Continue feature work only in small, named PR plans.
