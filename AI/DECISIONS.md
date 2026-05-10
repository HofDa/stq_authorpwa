# Decision Log

Use this file to prevent repeated architectural debates and agent drift.

## 2026-05-10 — Add project-local AI memory

Decision:
Add an `AI/` folder with architecture, current state, known issues, workflow rules and reusable PR/session templates.

Reason:
The project is large enough that repeating context inside every coding-agent chat wastes context-window budget and increases drift.

Tradeoffs:
More files to maintain, but much cheaper than repeatedly re-explaining architecture, constraints and known pitfalls.

Rejected alternatives:
Keeping all project knowledge only in chat history.

Follow-up:
Keep `AI/CURRENT_STATE.md` updated after larger PRs.

## Existing architectural decisions to preserve

### Authoring PWA exports to Flutter player

Decision:
The PWA is the authoring tool. The Flutter app remains the player. Exported JSON should remain compatible.

Implication:
Schema changes are treated like API changes.

### RRR core remains framework-independent

Decision:
RRR core logic must not depend on React or browser APIs.

Implication:
Browser/sensor/platform logic belongs in adapters such as `src/rrr-sensors/`, hooks, or UI-specific boundaries.

### MapLibre behind author-map boundary

Decision:
MapLibre is the map provider through shared map boundaries.

Implication:
Provider-specific implementation details should not leak broadly into unrelated components.
