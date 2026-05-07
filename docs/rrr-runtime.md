# RRR Runtime (`src/rrr-runtime/`)

Pure, framework-independent evaluator for modular riddles. No React, no
DOM, no real sensors. Inputs are plain values; outputs are plain data.

## Public surface

Re-exported via `src/rrr-runtime/index.ts`:

- `evaluateInteraction(interaction, mockState, userInput?, session?) => RrrInteractionResult`
  — single-shot evaluation of an `RrrInteraction`.
- `evaluateCondition(condition, moduleStatusById, session?) => RrrConditionResult`
  — evaluates a composite condition tree against module results.
- `evaluateModule(module, input) => RrrModuleResult`
  — evaluates one module against `(mockState, userInput, session)`.
- `createRrrRuntimeSession()` / `resetRrrRuntimeSession()` — produce a
  fresh session.
- `reduceRrrRuntimeSession(session, action)` — reducer with two action
  types: `{ type: 'reset' }` and `{ type: 'evaluation'; result }`.
- Types: `RrrRuntimeStatus`, `RrrRuntimeMockState`, `RrrRuntimeUserInput`,
  `RrrModuleResult`, `RrrConditionResult`, `RrrInteractionResult`,
  `RrrRuntimeSession`.

## Status values

`RrrRuntimeStatus = 'idle' | 'running' | 'success' | 'failed'`.

## Mock state shape

```ts
interface RrrRuntimeMockState {
  headingDegrees?: number;
  gpsLat?: number;
  gpsLng?: number;
  isStill?: boolean;
}

interface RrrRuntimeUserInput {
  textAnswer?: string;
}
```

These fields are how authoring previews drive the evaluator. They map
1:1 onto the mock-preview controls (`src/components/rrr-author/RrrMockPreview.tsx`).

## Session

```ts
interface RrrRuntimeSession {
  completedModuleIds: string[];
  activeSequenceIndex: number;
  status: RrrRuntimeStatus;
}
```

The reducer transitions a session in response to evaluations:

- `'reset'` — returns a fresh `idle` session with no completed modules
  and `activeSequenceIndex: 0`.
- `'evaluation'` — adopts the new `status`, advances
  `activeSequenceIndex` from the condition result, and unions any newly
  successful module ids into `completedModuleIds`.

Session is **optional** for `evaluateInteraction`. If omitted, modules
and conditions are evaluated without remembering progress (useful for
the always-live mock preview).

## What it does NOT do

- No real `DeviceOrientation`, `Geolocation`, or motion sensors.
- No timers; `hold_still`'s `durationMs` is interpreted by the
  evaluator's pure logic, not by wall-clock.
- No I/O, no network, no persistence.
- Does not own UI state. The `RrrMockPreview` component holds React
  state (inputs, session via `useReducer`), but the runtime itself is
  pure data-in / data-out.

## Tests

- `src/rrr-runtime/evaluateInteraction.test.ts`
- `src/rrr-runtime/evaluateCondition.test.ts`
- `src/rrr-runtime/evaluateModule.test.ts`
- `src/rrr-runtime/session.test.ts`

Run via `npm test` (vitest).
