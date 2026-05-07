# RRR Authoring Goal

Reactive Riddle Runtime (RRR) support lets the Author PWA describe modular, sensor-based riddles as data. A station can opt into this model with:

```json
{
  "riddleType": "modular",
  "interaction": {
    "schemaVersion": 1,
    "modules": []
  }
}
```

Core principle:

Do not implement final riddle runtime logic inside React components.

The Author PWA may edit, validate and preview interaction JSON.

The real player runtime should live in a separate framework-independent RRR package.

## Current Authoring Boundary

The Author PWA owns:

- Choosing `riddleType: "text"` or `riddleType: "modular"`.
- Editing `interaction.modules`.
- Editing `interaction.condition`.
- Validating the interaction JSON with the shared schema.
- Exporting modular interaction JSON.
- Running mock previews from manually controlled values only.

The Author PWA does not own:

- Real sensor access.
- Final player runtime evaluation.
- Device permissions.
- Camera, GPS, compass, or motion event integration.
- Production timing, retry, persistence, or anti-cheat behavior.

## Current Files

- `src/schema/riddle.ts`: schema for modular riddle data.
- `src/components/rrr-author/*`: React authoring UI for editing and previewing JSON.
- `src/rrr-preview/*`: framework-independent mock preview helpers for authoring.
- `src/export/tourExport.ts`: ZIP export path that preserves modular interaction data.

## Intentional MVP Limits

- Conditions are edited as a flat module-ID list in the UI.
- Nested conditions are supported by the schema shape, but not fully edited in the MVP UI.
- Mock preview uses manual values and is not the final runtime.
- Module config schemas are intentionally loose for now: `config` is a JSON object validated structurally, not semantically per module type.
