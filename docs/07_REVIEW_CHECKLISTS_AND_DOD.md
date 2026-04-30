# Review Checklists und Definition of Done

## Definition of Done für jeden UI/UX PR

Ein PR ist erst fertig, wenn:

```txt
[ ] Scope eingehalten
[ ] keine zukünftigen PRs vorweggenommen
[ ] TypeScript fehlerfrei
[ ] Lint fehlerfrei
[ ] Tests laufen
[ ] Build läuft
[ ] App startet lokal
[ ] Browser-Konsole ohne neue Warnungen
[ ] keine nested buttons
[ ] aktive Navigation passt zum Inhalt
[ ] keine offensichtliche mobile Regression
[ ] bestehende Stations-/Map-Funktion nicht kaputt
[ ] keine neuen Dependencies ohne Begründung
[ ] keine echten AI-API-Calls ohne explizite Freigabe
```

---

# UI/UX Review Checkliste

## Allgemein

```txt
[ ] Gibt es genau eine klare Hauptaufgabe auf dem Screen?
[ ] Sind sekundäre Elemente sichtbar, aber nicht dominant?
[ ] Passt der aktive Tab zum sichtbaren Inhalt?
[ ] Sind Labels verständlich?
[ ] Gibt es zu viele gleich starke Buttons?
[ ] Ist die rechte Preview wirklich nötig oder sollte sie eingeklappt sein?
[ ] Ist die linke Sidebar kontextbezogen?
[ ] Sind leere Zustände hilfreich?
[ ] Werden nächste Schritte klar?
```

## Plan

```txt
[ ] Plan zeigt Tour-Grunddaten
[ ] Plan zeigt Readiness
[ ] Plan zeigt Export Blockers
[ ] Keine große Karte
[ ] Keine Stations-Timeline
[ ] Keine Reorder-Controls
```

## Story

```txt
[ ] Story zeigt Storyline
[ ] Story zeigt Tonfall
[ ] Story zeigt Intro/Outro
[ ] Agentenplatz ist sinnvoll, aber nicht dominant
[ ] Phone Preview zeigt Intro/Outro, nicht zufällige Stationen
```

## Stations

```txt
[ ] Stationen sind klar sortiert
[ ] Auswahl ist eindeutig
[ ] Stationstatus ist sichtbar
[ ] Map/Edit-Modus ist verständlich
[ ] Station hinzufügen ist einfach
[ ] Kein Button-in-Button
```

## Route

```txt
[ ] Karte dominiert zurecht
[ ] Reihenfolge ist klar
[ ] Distanzen/Segmente sind sichtbar
[ ] Story-Reihenfolge und Distanzoptimierung werden nicht vermischt
```

## Preview

```txt
[ ] Phone Preview steht im Zentrum
[ ] Sprache ist testbar
[ ] Stationen sind testbar
[ ] Hints/Lösung/Success können simuliert werden
[ ] Export Readiness ist sichtbar
```

---

# Code Review Checkliste

```txt
[ ] Neue Komponenten haben klare Verantwortung
[ ] Keine Datei wird unnötig riesig
[ ] Keine duplizierte Readiness-Logik
[ ] Keine Browser-API direkt in UI-Komponenten, wenn Hook/Service sinnvoll wäre
[ ] Keine zirkulären Imports
[ ] Keine toten Imports
[ ] Keine any-Typen ohne guten Grund
[ ] Keine Datenmodelländerung ohne Migration/Begründung
[ ] Keine lokalen UI-Hacks, die spätere Workspaces blockieren
[ ] Keine API-Keys im Frontend
```

---

# Accessibility / DOM Checkliste

```txt
[ ] Kein <button> innerhalb von <button>
[ ] Interaktive Elemente haben type="button", wenn sie kein Submit sind
[ ] Icon-only buttons haben aria-label
[ ] Fokuszustände sind sichtbar
[ ] Dialoge haben Escape-Verhalten
[ ] Tastaturbedienung ist möglich
[ ] Keine Klickflächen nur über div ohne Tastaturersatz
[ ] Farbkontrast ausreichend
```

---

# Manual Smoke Test

Nach jedem PR:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Dann im Browser:

```txt
[ ] App öffnen
[ ] Plan anklicken
[ ] Story anklicken
[ ] Stations anklicken
[ ] Route anklicken
[ ] Preview anklicken
[ ] Sprache wechseln
[ ] Field Mode öffnen
[ ] Export Button sichtbar
[ ] Station auswählen
[ ] Karte lädt
[ ] Station hinzufügen
[ ] Browser Console prüfen
```

---

# Merge-Kriterien

## Safe to merge

```txt
- alle Must-Fixes erledigt
- keine neue Console-Warnung
- keine kaputte Hauptfunktion
- PR-Scope eingehalten
```

## Nicht mergen

```txt
- Typecheck kaputt
- Build kaputt
- Karte kaputt
- Stationsauswahl kaputt
- UI zeigt wieder alles gleichzeitig
- Agent/API-Code ohne geplante Boundary
- schwer nachvollziehbarer Monster-Diff
```

---

# Reviewer Output Format

## UX Reviewer

```txt
Pass/fail:
Must-fix:
Should-fix later:
Screenshot observations:
Suggested next PR:
```

## Code Reviewer

```txt
Safe to merge: yes/no
Must-fix:
Should-fix later:
Architecture notes:
Risks:
```

## QA Agent

```txt
Commands run:
Results:
Manual checks:
Regressions:
Merge recommendation:
```
