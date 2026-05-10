# Architecture — SouthTyrolQuests Author PWA

## Project summary

The app is a Vite + React + TypeScript PWA for creating SouthTyrolQuests tours in the field. It stores drafts locally, supports map-based station work, exports JSON and media bundles, and contains a Reactive Riddle Runtime (RRR) for modular riddle interactions.

## Main stack

- Vite + React + TypeScript
- React Router
- Tailwind CSS plus project CSS token files
- Zod schemas for JSON contracts
- Dexie / IndexedDB for local drafts and blobs
- MapLibre GL for maps
- Vitest for unit and boundary tests
- vite-plugin-pwa for PWA behavior

## Important source areas

```text
src/app/              App shell and routing
src/pages/            Route-level pages
src/components/       UI and feature components
src/components/studio Authoring studio and field-mode UI
src/components/map    Map boundary and MapLibre implementation
src/schema/           Zod schemas and exported JSON contracts
src/storage/          Dexie draft/blob persistence
src/export/           Tour export pipeline
src/rrr-core/         Framework-independent RRR logic
src/rrr-runtime/      Runtime bridge/session/evaluation logic
src/rrr-sensors/      Browser/platform sensor adapters and smoothing
src/rrr-preview/      Authoring preview/mock interaction helpers
src/styles/           CSS modules and shared styling files
src/theme/            Theme tokens
```

## Layer model

```text
Pages / Screens
↓
Feature Components
↓
Application hooks and services
↓
Schema / Storage / Export / Runtime logic
↓
Adapters: MapLibre, browser sensors, IndexedDB, camera, speech, files
```

## RRR architecture rule

The RRR core must remain framework-independent.

Allowed in `src/rrr-core/`:

- pure TypeScript types
- evaluator logic
- module/condition rules
- warning logic
- schema-aligned runtime contracts

Forbidden in `src/rrr-core/`:

- React
- hooks
- DOM access
- `window`
- `navigator`
- geolocation
- orientation/motion sensors
- direct browser APIs

Browser/platform code belongs in `src/rrr-sensors/` or UI-specific adapters.

## JSON/schema rule

The authoring PWA exports data consumed by the Flutter player. Treat schema changes as API changes.

Before changing schema files in `src/schema/` or RRR interaction contracts:

- identify consumers
- update tests
- preserve backwards compatibility where possible
- document the decision in `AI/DECISIONS.md`

## Styling rule

Use token-first styling.

Preferred:

- shared variables in `src/styles/tokens.css`
- project theme files in `src/theme/`
- existing component style files

Avoid:

- hardcoded one-off colors
- local theme forks
- duplicated magic spacing
- deep selector chains

## Map boundary rule

Map provider details should stay behind the author map boundary. Map-related changes should preserve:

- marker cleanup
- selected station panning
- route rendering
- current-position recentering
- mobile panel behavior
- safe fallback when map style env vars are missing

## Offline/PWA rule

The app shell is intended to be PWA-capable. Map tiles are currently online raster sources unless explicitly hardened.

Service worker and cache changes must be tested carefully for stale assets and update behavior.
