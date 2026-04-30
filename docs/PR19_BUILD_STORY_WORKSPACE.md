# PR-19 — Build Story Workspace

## Ziel

Der bisherige `StoryWorkspace`-Placeholder wird zu einem echten Arbeitsbereich für:

```txt
Storyline
Tone of voice
Intro
Outro
Writing rules
Story readiness
AssistantSlot
```

Noch **keine echte AI-API**. Nur UI, lokale Checks und vorbereitete Assistant-Aktionen.

## Erwartete Dateien

```txt
src/components/studio/workspaces/StoryWorkspace.tsx
src/components/studio/workspaces/storyWorkspaceUtils.ts
```

Optional, falls sinnvoll:

```txt
src/components/studio/workspaces/StoryToneChips.tsx
src/components/studio/workspaces/WritingRulesCard.tsx
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-19: Build Story Workspace.

Context:
The app has workflow workspaces: Plan, Story, Stations, Route, Preview.
PR-18 added an AssistantSlot scaffold. Now the Story workspace should become a real authoring area.

Goal:
Replace the StoryWorkspace placeholder with a real story authoring workspace.

Rules:
- Keep this PR focused.
- Do not add dependencies.
- Do not call external APIs.
- Do not implement real AI.
- Do not redesign unrelated screens.
- Do not break Stations/Map behavior.
- If the data model does not support all story fields yet, use graceful placeholders.
- Prefer small local helper functions over broad model changes.

Tasks:
1. Inspect the current draft/tour data model and identify existing story, intro, outro or description fields.
2. Implement StoryWorkspace with cards for:
   - Storyline
   - Tone of voice
   - Intro
   - Outro
   - Writing rules
   - Story readiness
   - AssistantSlot

3. Storyline card:
   Show current storyline if available.
   If missing, show:
   "No storyline defined yet."

4. Tone of voice card:
   Show tone chips such as:
   - playful
   - mysterious
   - scientific
   - family-friendly
   - adventurous
   - calm
   - poetic

   If tone is not persisted yet, display them as non-destructive UI placeholders.

5. Intro card:
   Show intro text if available.
   If missing, show:
   "Intro missing."

6. Outro card:
   Show outro text if available.
   If missing, show:
   "Outro missing."

7. Writing rules card:
   Show rules if available.
   Otherwise show suggested placeholder rules:
   - Use second person singular.
   - Keep station texts short.
   - Do not invent historical facts.
   - Explain scientific facts simply.
   - Hints should help without revealing the answer.

8. Add local story readiness checks:
   - storyline exists
   - intro exists
   - outro exists
   - tone exists
   - writing rules exist

9. Add AssistantSlot to StoryWorkspace.
   Suggested assistant actions:
   - Create missing intro
   - Create missing outro
   - Check story consistency
   - Suggest writing rules
   - Make tone more family-friendly

10. Assistant actions must not call real AI.
    They may be disabled, mock-only, or show a static suggestion if SuggestionPanel exists.

11. Layout:
    Desktop:
    - main column: Storyline, Intro, Outro, Writing Rules
    - side column: AssistantSlot, Story readiness, small preview/checklist

    Mobile:
    - stacked cards

12. Keep existing visual language:
    - paper-like cards
    - burgundy accents
    - rounded corners
    - calm spacing

Acceptance criteria:
- Clicking Story shows a real workspace, not a placeholder.
- Storyline, tone, intro, outro and writing rules are visible.
- Missing data is displayed gracefully.
- AssistantSlot appears in the Story workspace.
- No real AI API is called.
- Plan, Stations, Route and Preview behavior remain unchanged.
- No TypeScript errors.
- No nested button warnings.
- No new dependencies.

Run:
npm run typecheck
npm run lint
npm test
npm run build

Return:
- changed files
- summary
- failures
- suggested next PR
```

## UX Review Checklist

```txt
Does Story feel like a real writing/dramaturgy workspace?
Is the AssistantSlot present but not too dominant?
Are missing fields calm and understandable?
Is the layout readable on desktop and mobile?
Is it clear that no AI call is happening yet?
```
