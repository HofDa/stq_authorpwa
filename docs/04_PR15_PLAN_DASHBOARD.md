# PR-15 — Make Plan a Real Dashboard

## Ziel

Wenn `Plan` aktiv ist, zeigt die App ein echtes Plan-/Dashboard-Interface.

Nicht mehr:

- große Karte
- Stations-Timeline
- Reorder
- New Station
- dominante Phone Preview

Sondern:

```txt
Tour Basics
Audience & Theme
Tour Goal
Readiness
Export Blockers
Route Summary
```

## Warum?

`Plan` beantwortet:

> Was bauen wir?

Nicht:

> Wo stehen Pins auf der Karte?

## Non-goals

Dieser PR soll nicht:

- das Datenmodell groß ändern
- echte Agenten integrieren
- AI-API einbauen
- Stations/Route/Preview umbauen
- neue Dependencies hinzufügen

## Layout-Idee

```txt
------------------------------------------------
Plan
------------------------------------------------
[Tour basics]        [Readiness]
[Audience & theme]   [Export blockers]
[Tour goal]          [Route summary]
```

## Cards

### 1. Tour Basics

Zeigt, soweit vorhanden:

```txt
Title
Status
Version
Languages
Duration
Distance
```

Fehlende Werte:

```txt
Not set yet
```

### 2. Audience & Theme

Zeigt:

```txt
Target audience
Theme
Difficulty
Tour type
```

Wenn Felder noch nicht im Modell existieren:

```txt
Not set yet
```

Nicht sofort Datenmodell sprengen. Erst Platzhalter.

### 3. Tour Goal

Zeigt ein ruhiges Feld:

```txt
What should players experience, learn or find?
```

Wenn noch nicht gespeichert:

```txt
Not defined yet
```

Optional Info-Text:

```txt
A clear tour goal helps the story, stations and later assistant suggestions stay consistent.
```

### 4. Readiness

Beispiel:

```txt
Stations: 0/6 ready
Story: missing
Route: not reviewed
Preview: not tested
Export: not ready
```

### 5. Export Blockers

Beispiel:

```txt
Cannot export yet:
- Tour title is missing
- 6 station titles are missing
- Intro is missing
- Outro is missing
- Route has not been reviewed
```

Wenn okay:

```txt
Ready to export
```

### 6. Route Summary

Beispiel:

```txt
6 stations
0 m distance
No route reviewed yet
```

## Agent-Integration mitgedacht

Noch keine echte AI.

Aber PlanWorkspace darf bereits einen reservierten Bereich enthalten:

```txt
Plan assistant
Local checks only for now.
```

Das kann später durch `AssistantSlot` ersetzt werden.

---

# Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-15: Make Plan a real dashboard.

Context:
PR-14 introduced workflow workspaces.
Now PlanWorkspace should become a real dashboard. It should no longer show the large map/stations timeline.

Rules:
- Keep the PR small and focused.
- Do not implement future PRs.
- Do not add real AI API calls.
- Do not redesign unrelated screens.
- Do not change the data model unless explicitly required.
- Do not add new dependencies.
- Prefer composition over rewriting.
- Preserve existing behavior in Stations/Story/Route/Preview.
- Keep TypeScript strict and readable.

Tasks:
1. Update:
   src/components/studio/workspaces/PlanWorkspace.tsx

2. Build a responsive dashboard with cards:
   - Tour basics
   - Audience & theme
   - Tour goal
   - Readiness
   - Export blockers
   - Route summary

3. Use existing draft/tour data where available.
4. If fields do not exist, show safe placeholders:
   - Not set yet
   - Draft
   - Not reviewed
   - Missing

5. Add small helper functions inside PlanWorkspace if useful:
   - getReadyStationCount()
   - getExportBlockers()
   - formatDistance()
   - formatDuration()

6. Keep visual style consistent:
   - paper cards
   - burgundy accents
   - soft borders
   - calm layout

7. Do not show:
   - large map
   - station timeline
   - reorder controls
   - new station controls
   - dominant phone preview

Acceptance criteria:
- Plan tab shows dashboard cards.
- Stations tab still shows map/stations UI.
- Missing data is displayed gracefully.
- Export blockers are specific and useful.
- No TypeScript errors.
- No new dependencies.
- No console warnings.

Run:
npm run typecheck
npm run lint
npm test
npm run build

Return:
- changed files
- summary
- commands run
- failures or warnings
- follow-up recommendations
```

---

# UX Reviewer Checklist

```txt
[ ] Plan now feels like a planning dashboard
[ ] No large map dominates the Plan screen
[ ] No station timeline appears in Plan
[ ] Cards are calm and scannable
[ ] Missing data is understandable
[ ] Readiness gives useful next steps
[ ] Export blockers are specific
[ ] User understands what to do next
```

## Suggested Next PR

After this:

```txt
PR-16 — Add shared readiness/local-check model
```
