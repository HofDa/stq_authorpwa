---
name: schema-export
description: Use when modifying JSON schemas, export pipelines, migration logic, or multilingual riddle formats.
---

# Schema Export Skill

Read first:
- AI/RUNTIME_RULES.md
- AI/ARCHITECTURE.md

## Important rules

- Preserve backwards compatibility
- Avoid silent schema drift
- Validate export structures
- Preserve multilingual support

## Constraints

- Existing tours must continue to load
- Keep migrations explicit
- Avoid breaking ZIP exports

## Relevant areas

- src/schema/
- src/export/
- src/import/
- src/types/
