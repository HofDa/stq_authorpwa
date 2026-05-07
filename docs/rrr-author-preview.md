# RRR Author Preview (`src/components/rrr-author/`)

The authoring UI for modular riddles. All components are React and live
inside the Author PWA. They never call sensors and never own runtime
logic — they read/write `RrrInteraction` JSON and delegate evaluation
to `src/rrr-runtime/`.

## Authoring flow

A station with `riddleType === 'modular'` carries an `interaction`. The
editor surface is rendered by `RrrInteractionEditor` and is composed of
several focused panels:

1. **Template picker** — `RrrTemplatePicker.tsx`, fed by
   `RRR_TEMPLATES` in `src/rrr/templates.ts`. Picking a template
   validates it via `RrrInteractionSchema` and asks for confirmation
   before replacing a non-empty interaction.
2. **Module list** — add/remove modules and edit per-module config.
   `RRR_MODULE_TYPES`, `RRR_MODULE_PRESETS`, and
   `createRrrModuleFromPreset` (from `src/rrr/`) seed defaults.
3. **Condition editor** — pick condition type (`module`, `sequence`,
   `all_of`, `any_of`) and references to module ids.
   `repairRrrCondition` keeps the condition consistent when modules are
   removed.
4. **Mock preview** — `RrrMockPreview.tsx`. Always-live evaluation plus
   an optional session-driven evaluator with Start / Reset /
   Step controls and an "Auto evaluate on change" toggle.
5. **Warnings panel** — `RrrWarningsPanel.tsx`, fed by `getRrrWarnings`
   in `src/rrr/warnings.ts`. Surfaces info/warning entries (no modules,
   missing references, narrow tolerances, etc.) without blocking edits.
6. **JSON preview** — `RrrInteractionJsonEditor.tsx`. Lets the author
   inspect and paste raw interaction JSON; updates flow back through
   `RrrInteractionSchema`.

`riddleType` itself is selected on the station; switching it to
`'modular'` makes this editor surface available.

## Templates

`src/rrr/templates.ts` exposes `RRR_TEMPLATES` with five entries:

- `simple_text_answer`
- `compass_only`
- `compass_then_hold_still`
- `gps_then_compass`
- `any_text_or_compass`

Each is `{ id, label, description, interaction }`. The picker validates
before applying and deep-clones so editor mutations never leak back into
the template constants.

## Warnings

`getRrrWarnings(interaction)` (in `src/rrr/warnings.ts`) returns
`RrrWarning[]`, each with `code`, `message`, `severity` (`'info' |
'warning'`), and optional `moduleId`. Codes today:

- `no_modules`, `no_condition`
- `missing_module_reference`
- `sequence_no_steps`, `all_of_no_children`, `any_of_no_children`
- `text_answer_empty`
- `compass_target_invalid`, `compass_tolerance_narrow`
- `gps_missing_coordinates`, `gps_radius_small`
- `hold_duration_long`

A legacy `getRrrAuthoringWarnings` (in
`src/rrr/authoringWarnings.ts`) is still present for callers that
predate `RrrWarning`; new code should use `getRrrWarnings`.

## Mock preview behavior

`RrrMockPreview.tsx`:

- Holds local React state for the manual inputs
  (`heading`, `gpsLat`, `gpsLng`, `isStill`, `textAnswer`).
- Computes an always-live `evaluation` via
  `evaluateMockInteraction(interaction, inputs)` from
  `src/rrr-preview/evaluateMockInteraction.ts`.
- Holds a session via `useReducer(reduceRrrRuntimeSession, …)` for the
  Session panel. Buttons dispatch `{ type: 'reset' }` / `{ type:
  'evaluation', result }`. The session-driven evaluation is computed
  separately by calling `evaluateInteraction(interaction, mock,
  userInput, session)` directly.
- Auto-evaluate toggle re-dispatches an `'evaluation'` whenever inputs
  change while the session is `running`.

No browser sensors or timers are involved.

## What the author UI does NOT do

- Does **not** run the on-device riddle runtime. That runtime is
  intended to live in a separate framework-independent RRR package and
  consume the exported `interaction` JSON.
- Does **not** read real device orientation, GPS, motion, NFC, QR, or
  camera. The mock preview's controls are the only inputs.
- Does **not** mutate the legacy text-riddle authoring path.

## Tests touching the author UI

- `src/components/rrr-author/RrrConditionStatusTree.test.tsx`
- `src/rrr/templates.test.ts`
- `src/rrr/warnings.test.ts`
- `src/rrr/migrateInteraction.test.ts`
- `src/rrr-preview/evaluateMockInteraction.test.ts`
- `src/export/tourExport.test.ts` (modular export round-trip)
