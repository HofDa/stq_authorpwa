# RRR Codex Guardrails

These rules apply to future Codex changes for modular Reactive Riddle Runtime authoring.

## Non-Negotiable Principle

Do not implement final riddle runtime logic inside React components.

The Author PWA may edit, validate and preview interaction JSON.

The real player runtime should live in a separate framework-independent RRR package.

## Allowed In The Author PWA

Codex may add or change:

- React form controls that edit `interaction` JSON.
- Schema validation and compact validation feedback.
- Mock preview controls using manually entered values.
- Export serialization and export validation.
- Tests for authoring behavior, schema behavior, and mock preview behavior.
- Documentation for JSON shape and authoring workflows.

Mock preview logic should stay outside React when it becomes non-trivial. The current boundary is `src/rrr-preview/*`.

## Not Allowed In React Components

Do not add final runtime behavior such as:

- Real compass evaluation from `DeviceOrientationEvent`.
- Real GPS tracking from browser geolocation APIs.
- Camera or QR scanning.
- Motion sensor subscriptions.
- Permission request flows for sensors.
- Player-side retry, timing, persistence, scoring, or anti-cheat behavior.
- Business-critical success/failure state machines.

React components may call preview helpers with mock values. They must not become the real RRR runtime.

## Schema Guardrails

Current station fields:

- `riddleType: "text"` keeps the existing text-riddle flow.
- `riddleType: "modular"` enables `interaction`.
- `interaction.modules` stores atomic module definitions.
- `interaction.condition` stores the logical graph.

Current MVP module types:

- `text_answer`
- `compass_align`
- `hold_still`
- `gps_enter`

Current MVP condition types:

- `module`
- `sequence`
- `all_of`
- `any_of`

When adding new module or condition types:

- Update `src/schema/riddle.ts`.
- Update `docs/rrr-json-format.md`.
- Add schema tests.
- Add export tests if exported JSON changes.
- Keep old text riddles valid.
- Keep `interaction` optional for text riddles.

## Export Guardrails

Text riddles:

- Must keep existing export behavior.
- Must not export stale modular `interaction` data.

Modular riddles:

- Must export `riddleType: "modular"`.
- Must export the full `interaction` object.
- Must validate exported interaction data through the schema.
- Must surface errors through existing export validation patterns.

Do not change ZIP structure unless there is a separate explicit migration plan.

## Preview Guardrails

The mock preview is authoring-only.

It may:

- Accept manual heading, GPS, stillness, and text values.
- Show module status.
- Show condition status.
- Show overall `success`, `running`, or `failed`.

It must not:

- Access browser sensors.
- Ask for permissions.
- Use camera, geolocation, device orientation, or motion APIs.
- Be treated as final player runtime behavior.

## Review Checklist

Before finishing RRR-related work, verify:

- Existing text-riddle tests still pass.
- Existing export tests still pass.
- Modular schema changes have focused tests.
- React components only edit, validate, or preview JSON.
- Any evaluation-like code is clearly mock or moved into a framework-independent package/module.
- Documentation is updated when JSON shape changes.
