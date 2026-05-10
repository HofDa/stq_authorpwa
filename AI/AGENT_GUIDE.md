# Agent Guide

## Project

SouthTyrolQuests Authoring App

This project is a mobile-first authoring environment for creating GPS-guided riddle tours, station content, and modular interactive riddles.

The system combines:
- tour/station authoring
- multilingual content editing
- mobile preview
- modular riddle runtime
- sensor-based interactions
- map/GPS logic
- PWA/offline behavior

## Core Rules

- Read the AI folder before changing code.
- Prefer small PR-sized changes.
- Preserve existing architecture unless explicitly asked to change it.
- Avoid broad rewrites.
- Avoid unrelated cleanup.
- Use minimal diffs.
- Preserve JSON contracts.
- Verify behavior before claiming success.
- Update AI memory files after meaningful changes.

## Main Agent Role

The main agent acts as orchestrator.

Responsibilities:
- understand the global architecture
- create an updated plan
- split large tasks into focused subagent tasks
- choose the right specialist agent
- identify risks
- verify changes
- update project memory files

## Subagent Usage

Use subagents for focused work.

Recommended roles:

- `architecture-guardian`
- `runtime-engineer`
- `sensor-engineer`
- `mobile-studio`
- `ui-designer`
- `authoring-ux`
- `schema-guardian`
- `pwa-offline`
- `qa-auditor`
- `performance-guardian`
- `map-gps`
- `interaction-designer`
- `content-flow`
- `accessibility`
- `security-privacy`
- `release-manager`

## Important Project Constraints

- mobile-first
- offline-capable
- schema-driven interactions
- modular Reactive Riddle Runtime
- reusable riddle modules
- stable multilingual JSON structure
- clean separation between editor UI and runtime execution
- no direct sensor access from UI components
- no runtime logic inside visual components

## Coding Rules

- no slop code
- no dead code
- no spaghetti code
- no unnecessary abstractions
- no utility explosion
- no hidden global state
- no broad refactors disguised as cleanup

## Design Rules

- token-based styling
- no hardcoded colors when tokens exist
- consistent spacing
- clear hierarchy
- mobile-friendly touch targets
- accessible controls
- readable multilingual layouts

## Verification Rules

Before claiming success, run or explain:

- lint
- typecheck
- build
- relevant unit tests
- UI smoke checks
- mobile viewport checks if relevant
- PWA/offline checks if relevant
- schema compatibility checks if relevant

## Memory Update Rules

Update these files when useful:

- `AI/CURRENT_STATE.md`
- `AI/DECISIONS.md`
- `AI/KNOWN_ISSUES.md`
- `AI/ROADMAP.md`

Do not update them for tiny cosmetic changes unless they affect architecture, workflow, runtime behavior, or known risks.