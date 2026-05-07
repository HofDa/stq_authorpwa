# RRR Player Contract

This document describes the current contract between the Author PWA export and a future Player PWA runtime for modular RRR riddles.

It is a contract document only. It does not introduce new player code paths.

## Export Shape

Text riddles continue to export through the existing text-riddle fields. Modular riddles export the additional RRR fields:

```ts
{
  riddleType: "modular";
  interactionVersion: 1;
  interaction: {
    schemaVersion: 1;
    modules: RrrModule[];
    condition?: RrrCondition;
  };
}
```

The Author PWA currently includes `interactionVersion` and `interaction` only when `riddleType` is `"modular"`. Text riddles should not rely on stale or unused `interaction` data being present in the exported JSON.

## MVP Modules

The current schema/core-supported module types are:

- `text_answer`
- `compass_align`
- `hold_still`
- `gps_enter`

Each module is exported as:

```ts
type RrrModule = {
  id: string;
  type: "text_answer" | "compass_align" | "hold_still" | "gps_enter";
  label: string;
  config: Record<string, unknown>;
};
```

Module-specific config is intentionally stored as JSON-like unknown values. The runtime evaluator is responsible for reading the fields it supports defensively.

## MVP Conditions

The current schema/core-supported condition types are:

- `module`
- `sequence`
- `all_of`
- `any_of`

The condition graph shape is:

```ts
type RrrCondition =
  | { type: "module"; moduleId: string }
  | { type: "sequence"; steps: RrrCondition[] }
  | { type: "sequence"; children: RrrCondition[] }
  | { type: "all_of" | "any_of"; children: RrrCondition[] };
```

`sequence.children` exists for compatibility with earlier draft shapes. New authoring/export code should prefer `sequence.steps`.

## Player Responsibilities

A future Player PWA should:

- load modular `interaction` data when `riddleType` is `"modular"`
- verify or migrate `interactionVersion` before evaluation
- validate the interaction shape before running it
- collect user input and sensor state needed by the modules
- run the RRR evaluator and session state logic
- emit success into the existing station success flow when the interaction succeeds
- show a clear fallback when required sensors are unavailable or denied

Sensor collection is a player/runtime concern. The exported interaction JSON does not request permissions or access browser APIs by itself.

## Author Responsibilities

The Author PWA should:

- create valid interaction JSON
- export `interactionVersion: 1` for modular riddles
- export `interaction` for modular riddles
- avoid unsupported module or condition types unless the schema explicitly allows them
- keep text riddles compatible with the existing text-riddle export contract

Authoring may preserve draft-only state internally, but exported modular data must pass the export schema.

## Non-Goals For Now

The current MVP contract does not include:

- NFC
- AR
- multiplayer
- real sensor smoothing
- full nested visual condition editing beyond the currently supported JSON condition graph

These can be added later through explicit schema/runtime versioning and migration work.
