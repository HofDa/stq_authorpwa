# Review Checklist for PR-19 to PR-25

Use this file for every PR review.

## General DoD

```txt
npm run typecheck
npm run lint
npm test
npm run build
```

Also manually check:

```txt
No nested button warnings
No React runtime warnings introduced
No broken MapLibre behavior
No station data loss
No export regression
No new dependency unless explicitly allowed
No direct AI API call
No frontend API keys
```

## UX Checklist

```txt
Does the active workflow tab match the visible content?
Is the screen focused on one main task?
Is there one obvious primary action?
Are secondary panels collapsible or clearly secondary?
Are empty states calm and helpful?
Does mobile avoid cramped side panels?
Does the UI feel like a production workflow, not an admin dump?
```

## Code Review Checklist

```txt
Is the diff small enough?
Are components split by responsibility?
Are helper functions pure where possible?
Is state local unless it must be shared?
Are props understandable?
Are imports clean?
Are old dead components removed only when safe?
Are future PRs not accidentally implemented?
```

## Agent Integration Checklist

```txt
Does this PR prepare agent integration without overbuilding?
Are suggestions reviewable?
Are AI actions non-destructive?
Is Apply user-controlled?
Is Dismiss possible?
Are local checks useful without AI?
Are mock suggestions deterministic?
Is provider integration still disabled until PR-25?
```

## PR-specific notes

### PR-19 Story Workspace

```txt
Storyline visible
Intro visible
Outro visible
Tone visible
Writing rules visible
AssistantSlot visible
No real AI
```

### PR-20 Stations Map/Edit

```txt
Map mode works
Edit mode focuses on content
Selected station persists
No drag/drop introduced
MapLibre still works
```

### PR-21 Preview Collapsible

```txt
Preview no longer dominates Plan/Route
Stations can collapse preview
Preview tab uses main preview mode
Mobile works
```

### PR-22 Route Workspace

```txt
Route map visible
Segment list visible
Missing coordinates handled
Long segment warnings local
No automatic reorder
```

### PR-23 Preview Workspace

```txt
Large central preview
Intro/station/success/outro selectable
Station selector works
Missing content shown
Useful for client demo
```

### PR-24 Mock Suggestions

```txt
Suggestions structured
Dismiss works
No auto-apply
Apply disabled if unsafe
No API calls
```

### PR-25 AI Boundary

```txt
AiClient interface exists
MockAiClient works
Agent action IDs centralized
Provider mode mock by default
No API keys
No external calls
Security note exists
```

## Reviewer prompts

### UX Reviewer

```txt
You are the UX Reviewer Agent.

Review this PR only for user experience and workflow clarity.
Do not request a complete redesign.
Focus on:
- active workflow tab vs visible content
- visual overload
- primary action clarity
- mobile sanity
- assistant/agent placement

Output:
- Pass/fail
- 5 concrete issues max
- recommended next PR
```

### Code Reviewer

```txt
You are the Code Reviewer Agent.

Review this PR for architecture and maintainability.
Focus on:
- scope creep
- component boundaries
- TypeScript safety
- hidden behavior changes
- dead imports
- regression risk
- future agent integration safety

Output:
- Must fix
- Should fix later
- Safe to merge?
```

### QA Agent

```txt
You are the QA/Test Agent.

Run or inspect the PR for:
- typecheck
- lint
- tests
- build
- runtime console warnings
- main user flows

Main flows:
- open app
- switch workflow tabs
- use Stations map
- select station
- open Preview
- export if available

Output:
- commands run
- results
- manual checks
- blockers
```
