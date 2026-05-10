# Agent Guide — SouthTyrolQuests Author PWA

## Purpose

This repository is the mobile-first authoring PWA for SouthTyrolQuests. It creates tour JSON, riddle JSON, route data and media exports that the SouthTyrolQuests Flutter player app can consume unchanged.

The main agent should act as an orchestrator. Implementation, QA, UI review and architecture review should be split into focused subagent-style tasks when the scope is larger than a small one-file change.

## Default working mode

1. Read the files in `AI/` before changing code.
2. Create an updated plan for the current task.
3. Keep changes PR-sized and reversible.
4. Prefer minimal diffs over broad rewrites.
5. Preserve public JSON contracts unless the task explicitly requests a migration.
6. Run relevant validation before claiming success.
7. Update `AI/CURRENT_STATE.md`, `AI/DECISIONS.md` or `AI/KNOWN_ISSUES.md` when the work changes project knowledge.

## Project priorities

- Mobile-first authoring experience.
- Offline-capable field use.
- Stable JSON export for the Flutter app.
- Clean separation between authoring UI, schema, storage, map code, RRR runtime and browser sensor adapters.
- Production-ready code with simple, understandable patterns.

## Non-negotiables

- Do not access browser APIs inside framework-independent RRR core logic.
- Do not couple runtime/domain logic directly to React components.
- Do not introduce one-off local design colors when shared CSS tokens exist.
- Do not rewrite working systems unless a migration plan is part of the task.
- Do not change exported JSON structures casually.
- Do not remove tests just to make a task pass.

## Preferred validation commands

Use the relevant subset for the change:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

For UI work, also verify manually in the browser, especially mobile viewport behavior.

## Output expected from agents

Every larger task should end with:

- what changed
- files touched
- validation run
- risks or untested areas
- suggested next safe PR
