# PR-39 — Admin Meta Editor für interne Projektsteuerung

## Ziel

Den Tab **Intern** als Editor für organisatorische, rechtliche und workflowbezogene Metadaten ausbauen.

Diese Daten sind **nicht sichtbar für Enduser**.

## Bereiche

```txt
Workflow
Team
Versionierung
Rechte & Freigabe
Partner / Auftrag
Wartung
```

## Felder

### Workflow Status

Button-Auswahl:

```txt
[Idee]
[Recherche]
[Field Capture]
[Draft]
[Content Review]
[Translation Review]
[Playtest Ready]
[Tested]
[Approved]
[Published]
[Archived]
```

Speichert:

```ts
adminMeta.status
```

### Team

Textfelder oder später Kontakt-Auswahl:

```txt
Owner
Content Lead
Field Researcher
Translator
Technical Reviewer
```

### Versionierung

```txt
Schema Version
Content Version
Created At
Updated At
Reviewed By
```

### Rechte & Freigabe

Toggle-Buttons:

```txt
[Bildrechte geklärt]
[Audiorechte geklärt]
[Nutzt Drittmaterial]
[Gemeindefreigabe nötig]
[Gemeindefreigabe erhalten]
[Privatgrund geprüft]
[Wege öffentlich geprüft]
```

### Partner / Auftrag

```txt
Client
Sponsor
Project Type
Visibility
Maintenance Included
Maintenance Until
```

## UX-Hinweis

Rechte und Freigaben sollten nicht nur als Textfelder erscheinen.  
Besser:

```txt
Bildrechte:           [offen] [geklärt] [nicht nötig]
Gemeindefreigabe:     [offen] [nötig] [erhalten]
Privatgrund:          [ungeprüft] [kein Privatgrund] [Achtung]
```

## Datenbeispiel

```json
{
  "adminMeta": {
    "status": "draft",
    "owner": "David",
    "approvedForPublishing": false,
    "rights": {
      "imageRightsCleared": false,
      "audioRightsCleared": true,
      "usesThirdPartyContent": false,
      "requiresMunicipalityApproval": true
    },
    "business": {
      "client": "Tourismusverein Schenna",
      "projectType": "commissioned_tour",
      "visibility": "public"
    }
  }
}
```

## Acceptance Criteria

- Interner Tab ist bearbeitbar.
- Status wird über Buttons gesetzt.
- Rechte/Freigaben werden als Toggle oder Segmented Control gepflegt.
- Enduser-sichtbare Inhalte erscheinen hier nicht.
- AI-Kontext erscheint hier nicht.
- Publishing-relevante Felder können später für Checks genutzt werden.

## Tests

- Status-Auswahl aktualisiert `adminMeta.status`.
- Rechte-Toggles aktualisieren `adminMeta.rights`.
- Editor rendert mit fehlenden adminMeta-Daten.
- Keine publicMeta-Felder werden verändert.

## Codex Prompt

```txt
Implement PR-39.

Goal:
Build AdminMetaEditor for internal workflow, team, rights and publishing metadata.

Requirements:
- Add status selector with all workflow states.
- Add rights/freigabe toggles or segmented controls.
- Add basic team and version fields.
- Keep this data separate from publicMeta, authoringMeta, aiContext and story.
- Add tests for status and rights updates.
- No AI calls.

After implementation:
- Run typecheck/tests.
- Summarize changes.
```
