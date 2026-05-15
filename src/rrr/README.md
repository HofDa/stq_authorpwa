# RRR Public API

`src/rrr` is the public Reactive Riddle Runtime boundary for app, UI, schema,
export and authoring code.

- Import schema and authoring helpers from `@/rrr`.
- Import schema-only constants and types from `@/rrr/types` when a lower-level
  schema module must avoid the root facade.
- Import runtime bridge APIs from `@/rrr/runtime`.
- Import authoring preview APIs from `@/rrr/preview`.
- Import field-test sensor adapter APIs from `@/rrr/sensors`.

`src/rrr-core`, `src/rrr-runtime`, `src/rrr-preview` and `src/rrr-sensors` are
internal implementation packages. UI and app code should not import those
packages directly; use the public facades above so the core/runtime boundary
stays explicit.
