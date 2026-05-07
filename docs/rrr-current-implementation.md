# RRR — Current Implementation Snapshot

Reactive Riddle Runtime (RRR) is the modular alternative to the legacy text
riddle. This document describes what is **actually shipped today** in this
repo. For runtime details see [`rrr-runtime.md`](./rrr-runtime.md); for
authoring/preview details see [`rrr-author-preview.md`](./rrr-author-preview.md).

## Where the code lives

- `src/rrr/` — pure data layer: types, templates, examples, validation
  helpers, authoring warnings, migration helper.
- `src/rrr-runtime/` — pure, framework-independent evaluator and session
  reducer.
- `src/rrr-preview/` — thin adapter that maps mock UI inputs to a single
  evaluator call.
- `src/components/rrr-author/` — React UI for editing, previewing, and
  inspecting RRR interactions inside the Author PWA.
- `src/schema/riddle.ts` — Zod schemas (`RrrModuleSchema`,
  `RrrInteractionSchema`, station integration via `riddleType`).

## Riddle types on a station

`RiddleTypeSchema = z.enum(['text', 'modular'])` (defined in
`src/schema/riddle.ts`). A station carries `riddleType: 'text' | 'modular'`,
defaulting to `'text'`. The legacy text-riddle path is unchanged.

When `riddleType === 'modular'`, the station also carries:

- `interactionVersion: 1` (literal) — see `RRR_INTERACTION_VERSION` in
  `src/rrr/types.ts`.
- `interaction: RrrInteraction` — validated by `RrrInteractionSchema`.

Export (`src/export/tourExport.ts`) only emits `interactionVersion` and
`interaction` when the station is modular; text riddles export unchanged.

## Supported module types

Defined in `RRR_MODULE_TYPES` in `src/rrr/types.ts`:

| Type            | Purpose                                                                    | Notable config keys                  |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| `text_answer`   | Author-defined accepted answer; user must type a matching string.          | `answer`, `caseSensitive`            |
| `compass_align` | Device heading must be near a target bearing.                              | `targetDegrees`, `tolerance`         |
| `hold_still`    | Device must remain still for a duration.                                   | `durationMs`                         |
| `gps_enter`     | Device must enter a circular GPS region.                                   | `lat`, `lng`, `radiusMeters`         |

`config` is stored as `Record<string, unknown>` (see `RrrModuleSchema`),
so unknown fields are preserved through validation and export.

## Supported condition types

Defined in `RRR_CONDITION_TYPES` in `src/rrr/types.ts`:

- `module` — references a single `moduleId`.
- `sequence` — ordered list of child conditions; both `steps` and
  `children` shapes are accepted by the schema (`steps` is the canonical
  authoring form).
- `all_of` — every child must succeed.
- `any_of` — any child succeeding satisfies the condition.

Composite conditions can nest. The schema (`RrrInteractionSchema`)
enforces non-empty children for composites at validation time and rejects
duplicate module ids and dangling references.

## Current interaction shape

```ts
interface RrrInteraction {
  schemaVersion: 1;
  modules: RrrModule[];
  condition?: RrrCondition;
}
```

A minimal valid interaction is `{ schemaVersion: 1, modules: [] }`.
`createEmptyRrrInteraction()` and `createDefaultRrrInteraction()` in
`src/schema/riddle.ts` produce the canonical empty and one-module
defaults.

## Known limitations (today)

- **No final Player PWA runtime integration yet.** The Author PWA can
  edit, validate, and preview interaction JSON; the real on-device
  Player runtime is intended to live in a separate framework-independent
  RRR package and consume the exported JSON.
- **No real browser sensor integration.** The mock preview drives the
  evaluator from manually entered values (heading, GPS, stillness,
  text). No `DeviceOrientation` / `Geolocation` wiring is present in the
  Author PWA.
- **No NFC, QR, camera, or audio modules.** Only the four module types
  listed above exist.
- **Nested conditions are supported** by the schema and runtime
  (`evaluateCondition` recurses), but the authoring UI focuses on flat
  single-level composites today.

## Guardrails for future PRs

- Do **not** implement final on-device riddle runtime logic inside React
  components. The Author PWA may edit, validate, and preview interaction
  JSON; runtime evaluation must stay in `src/rrr-runtime/` (or a future
  standalone package).
- Do **not** break the existing text-riddle path. Anything new should
  branch on `riddleType === 'modular'`.
- Do **not** silently accept invalid interactions. Use
  `RrrInteractionSchema` (or the existing migration/warning helpers in
  `src/rrr/`) for validation rather than ad-hoc checks.
