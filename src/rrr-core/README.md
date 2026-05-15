# RRR Core

Internal, framework-independent Reactive Riddle Runtime logic only.

- No React components or hooks.
- No browser APIs such as `window`, `navigator`, geolocation, orientation, or motion sensors.
- No UI rendering.
- No app, UI, schema or export imports should target `@/rrr-core` directly.

Browser adapters live in `src/rrr-sensors/`. Authoring and preview UI stays in
`src/components/`. App-facing imports go through the public facades in
`src/rrr/`.
