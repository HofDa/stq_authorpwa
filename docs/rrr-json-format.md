# RRR JSON Format

Modular riddles are stored on a station with:

```json
{
  "riddleType": "modular",
  "interaction": {
    "schemaVersion": 1,
    "modules": []
  }
}
```

`interaction` is optional while authoring legacy or text riddles. For exported modular riddles, `interaction` is required and validated with `RrrInteractionSchema`.

## interaction.modules

`interaction.modules` is an array of atomic module definitions.

Each module has:

```json
{
  "id": "module_1",
  "type": "text_answer",
  "label": "Text answer",
  "config": {}
}
```

Module IDs must be unique inside the interaction. Conditions reference modules by `id`.

## Supported MVP Modules

### text_answer

```json
{
  "id": "module_1",
  "type": "text_answer",
  "label": "Text answer",
  "config": {
    "answer": "tower",
    "caseSensitive": false
  }
}
```

### compass_align

```json
{
  "id": "face_north_1",
  "type": "compass_align",
  "label": "Compass align",
  "config": {
    "targetDegrees": 0,
    "tolerance": 15
  }
}
```

### hold_still

```json
{
  "id": "hold_still_1",
  "type": "hold_still",
  "label": "Hold still",
  "config": {
    "durationMs": 3000
  }
}
```

### gps_enter

```json
{
  "id": "gps_enter_1",
  "type": "gps_enter",
  "label": "GPS enter",
  "config": {
    "lat": 46.4983,
    "lng": 11.3548,
    "radiusMeters": 20
  }
}
```

## interaction.condition

`interaction.condition` defines how module statuses are combined.
It is optional while an author is still drafting the interaction.

Supported MVP condition types:

- `module`
- `sequence`
- `all_of`
- `any_of`

### Single Module

```json
{
  "type": "module",
  "moduleId": "module_1"
}
```

### Sequence

Order is stored by the order of `children`.

```json
{
  "type": "sequence",
  "children": [
    { "type": "module", "moduleId": "face_north_1" },
    { "type": "module", "moduleId": "hold_still_1" },
    { "type": "module", "moduleId": "module_1" }
  ]
}
```

### All Of

```json
{
  "type": "all_of",
  "children": [
    { "type": "module", "moduleId": "face_north_1" },
    { "type": "module", "moduleId": "hold_still_1" }
  ]
}
```

### Any Of

```json
{
  "type": "any_of",
  "children": [
    { "type": "module", "moduleId": "module_1" },
    { "type": "module", "moduleId": "gps_enter_1" }
  ]
}
```

## Complete Example

```json
{
  "riddleType": "modular",
  "interaction": {
    "schemaVersion": 1,
    "modules": [
      {
        "id": "face_north_1",
        "type": "compass_align",
        "label": "Face north",
        "config": {
          "targetDegrees": 0,
          "tolerance": 15
        }
      },
      {
        "id": "hold_still_1",
        "type": "hold_still",
        "label": "Hold still",
        "config": {
          "durationMs": 3000
        }
      }
    ],
    "condition": {
      "type": "sequence",
      "children": [
        { "type": "module", "moduleId": "face_north_1" },
        { "type": "module", "moduleId": "hold_still_1" }
      ]
    }
  }
}
```

## Not Included Yet

- Per-module semantic config schemas.
- Nested condition editing in the UI.
- Real sensor runtime behavior.
- Runtime permission handling.
- Player-side event lifecycle.
- Production success/failure persistence.
