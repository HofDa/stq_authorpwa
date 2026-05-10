# RRR Runtime Rules

## Core boundary

`src/rrr-core/` is framework-independent.

Forbidden there:

- React components
- React hooks
- DOM access
- browser APIs
- direct sensor access
- UI rendering

## Runtime expectations

- Prefer deterministic logic.
- Validate invalid states explicitly.
- Keep module evaluation testable without UI.
- Keep schemas and runtime behavior aligned.
- Add tests for invalid data, edge cases and composite behavior.

## Browser/platform logic

Put browser-specific behavior in:

- `src/rrr-sensors/`
- React hooks
- UI adapters
- runtime bridges that explicitly sit at the platform boundary

## Before adding a new riddle module

- Define module JSON shape.
- Define authoring UI requirements.
- Define runtime behavior.
- Define fallback/manual behavior.
- Add tests.
- Check export/player compatibility.
