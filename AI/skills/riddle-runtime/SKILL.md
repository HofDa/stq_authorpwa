---
name: riddle-runtime
description: Use when changing RRR runtime, modular riddles, conditions, sensors, runtime bridge, or riddle JSON.
---

# Riddle Runtime Skill

Read first:
- AI/RUNTIME_RULES.md
- AI/ARCHITECTURE.md

## Non-negotiable rules

- Do not put runtime logic into UI components
- Keep runtime framework-independent
- Preserve deterministic evaluation
- Keep sensor logic isolated
- Add tests for runtime changes

## Existing concepts

Atomic:
- compass_align
- hold_still
- qr_scan
- tilt_angle

Composite:
- sequence
- all_of

## Relevant areas

- src/rrr-core/
- src/rrr-runtime/
- src/rrr-sensors/
- src/components/rrr-author/
