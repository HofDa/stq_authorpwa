# Known Issues and Pitfalls

## Active cautions

### Map tiles are not fully offline-ready

Symptoms:
The PWA shell can work offline, but map tiles depend on online raster sources unless explicit offline tile support is added.

Risk:
Field use in weak-signal areas can appear broken if authors expect offline maps.

Mitigation:
Document offline limitations clearly and test map behavior in airplane mode before claiming offline map support.

### Browser speech recognition is inconsistent

Symptoms:
Dictation behavior differs between Chrome, Safari, desktop and mobile browsers.

Risk:
Assistant/storyline input may work on one browser and fail on another.

Mitigation:
Keep speech recognition behind a shared hook and provide graceful fallback to manual input.

### RRR core can accidentally absorb browser logic

Symptoms:
Agents may place sensor, window, navigator or React logic into core runtime files.

Risk:
Boundary tests fail and runtime becomes harder to test.

Mitigation:
Keep browser APIs in `src/rrr-sensors/`, hooks or component adapters.

### Mobile drawer and keyboard behavior can regress easily

Symptoms:
Right drawers, sheets, story input bars and map panels can break on small screens or when the keyboard opens.

Risk:
Authoring in the field becomes frustrating.

Mitigation:
Manual mobile viewport checks are required for UI work.

### Schema drift can break player compatibility

Symptoms:
Authoring export changes silently diverge from what the Flutter app expects.

Risk:
Tours export successfully but fail in the player.

Mitigation:
Update schema tests and document any contract change in `AI/DECISIONS.md`.

## Resolved issues

Add resolved issues here with date, affected files and fix summary.
