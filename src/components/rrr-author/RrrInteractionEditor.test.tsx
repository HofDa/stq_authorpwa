/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RRR_MODULE_TYPES, type RrrInteraction } from '@/rrr';
import { RrrInteractionEditor } from './RrrInteractionEditor';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('RrrInteractionEditor', () => {
  it('groups module picker options by author category without changing creation types', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor interaction={emptyInteraction} onChange={onChange} />,
    );

    const select = container.querySelector('#rrr-module-type');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error('Module type select not found');
    }

    const groups = Array.from(select.querySelectorAll('optgroup'));
    expect(groups.map((group) => group.label)).toEqual([
      'Einfache Aufgaben',
      'Ort & Bewegung',
      'Ausrichtung & Sensoren',
      'Scannen & Medien',
      'Ersatzlösungen',
    ]);
    const options = Array.from(select.options);
    expect(options).toHaveLength(RRR_MODULE_TYPES.length);
    expect(options.map((option) => option.value)).toEqual(
      expect.arrayContaining([...RRR_MODULE_TYPES]),
    );
    expect(options.map((option) => option.text)).toEqual(
      expect.arrayContaining([
        'Textantwort',
        'Auswahlfrage',
        'Ort erreichen',
        'Nähe warm/kalt',
        'Richtung finden',
        'Richtung warm/kalt',
        'Stillhalten',
        'QR-Code scannen',
        'Codewort eingeben',
        'Gesammelten Code eingeben',
        'Warten',
        'Foto-Aufgabe bestätigen',
        'Objekt gefunden',
      ]),
    );
    expect(container.textContent).toContain('Textantwort');
    expect(container.textContent).toContain('Einfach');
    expect(container.textContent).toContain('Sehr zuverlässig');
    expect(container.textContent).toContain('Robust');

    changeSelectElementValue(select, 'gps_enter');
    expect(container.textContent).toContain('Ort erreichen');
    expect(container.textContent).toContain('Fortgeschritten');
    expect(container.textContent).toContain('Geräteabhängig');
    expect(container.textContent).toContain('Ersatzlösung empfohlen');
    expect(container.textContent).toContain('Für Feldtests prüfen');

    changeSelectElementValue(select, 'object_found');
    expect(container.textContent).toContain('Objekt gefunden');
    expect(container.textContent).toContain('Sehr zuverlässig');
    expect(container.textContent).toContain('Robust');
    expect(container.textContent).not.toContain('Ersatzlösung empfohlen');

    changeSelectElementValue(select, 'code_word');
    clickButton('Hinzufügen');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0]).toMatchObject({
      type: 'code_word',
      label: 'Codewort eingeben',
    });
  });

  it('renders sequence conditions as readable steps', () => {
    const html = renderToStaticMarkup(
      <RrrInteractionEditor interaction={sequenceInteraction} onChange={() => {}} />,
    );

    expect(html).toContain('Schritt 1: Am richtigen Ort stehen');
    expect(html).toContain('Schritt 2: In Richtung Norden schauen');
    expect(html).toContain('Schritt 3: Handy ruhig halten');
    expect(html).toContain('Am richtigen Ort stehen');
    expect(html).toContain('In eine Richtung schauen');
    expect(html).toContain('Handy ruhig halten');
    expect(html).toContain('Bearbeiten');
    expect(html).toContain('Geführter Test');
    expect(html).toContain('Aktueller Schritt');
    expect(html).toContain('Der Spieler steht am richtigen Ort innerhalb des Radius.');
    expect(html).toContain('Innerhalb des Radius');
    expect(html).toContain('Expertenmodus');
    expect(html).not.toContain('Expertendetails');
    expect(html).not.toContain('Technische Vorschau');
    expect(html).toContain('Schritt hinzufügen');
  });

  it('shows broken sequence step references', () => {
    const html = renderToStaticMarkup(
      <RrrInteractionEditor
        interaction={{
          ...sequenceInteraction,
          condition: {
            type: 'sequence',
            steps: [
              { type: 'module', moduleId: 'gps_enter_1' },
              { type: 'module', moduleId: 'deleted_module' },
            ],
          },
        }}
        onChange={() => {}}
      />,
    );

    expect(html).toContain('Schritt 2: Fehlender Baustein');
    expect(html).toContain('Dieser Baustein fehlt oder wurde gelöscht.');
    expect(html).toContain('Die Lösungsregel enthält einen gelöschten Baustein.');
    expect(html).not.toContain('deleted_module');
  });

  it('updates compass targetDegrees from direction presets', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={sequenceInteraction}
        onChange={onChange}
      />,
    );

    clickButton('Bearbeiten', 1);

    expect(container.textContent).toContain('Ausgewählte Richtung');
    expect(container.textContent).toContain('Norden 0°');
    expect(container.textContent).toContain('Osten 90°');
    expect(container.textContent).toContain('Toleranz in Grad');
    expect(container.textContent).not.toContain('Zielrichtung in Grad');

    clickButton('Osten 90°');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    const compassModule = nextInteraction.modules.find(
      (module) => module.id === 'face_north_1',
    );
    expect(compassModule?.config).toMatchObject({
      targetDegrees: 90,
      tolerance: 15,
    });
  });

  it('updates gps radiusMeters from the radius slider', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={sequenceInteraction}
        onChange={onChange}
      />,
    );

    clickButton('Bearbeiten', 0);

    expect(container.textContent).toContain('Breitengrad');
    expect(container.textContent).toContain('Längengrad');
    expect(container.textContent).toContain('Radius per Schieberegler');
    expect(container.textContent).toContain('Großzügig');
    expect(container.textContent).toContain('GPS-Genauigkeit');
    expect(container.textContent).toContain('20 m ein sinnvoller Startwert');

    changeRangeValue('30');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    const gpsModule = nextInteraction.modules.find(
      (module) => module.id === 'gps_enter_1',
    );
    expect(gpsModule?.config).toMatchObject({
      lat: 46.4983,
      lng: 11.3548,
      radiusMeters: 30,
    });
  });

  it('updates hold_still durationMs from friendly controls', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={sequenceInteraction}
        onChange={onChange}
      />,
    );

    clickButton('Bearbeiten', 2);

    expect(container.textContent).toContain('Dauer per Schieberegler');
    expect(container.textContent).toContain('Normal');
    expect(container.textContent).toContain('1 s');
    expect(container.textContent).toContain('5 s');
    expect(container.textContent).not.toContain('Dauer in ms');

    toggleExpertMode();

    expect(container.textContent).toContain('Dauer in ms');

    clickButton('5 s');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    const holdModule = nextInteraction.modules.find(
      (module) => module.id === 'hold_still_1',
    );
    expect(holdModule?.config).toMatchObject({
      durationMs: 5000,
    });
  });

  it('renders text_answer authoring helpers and keeps empty answer warnings visible', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={textAnswerInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Hinweise');
    expect(container.textContent).toContain('hat noch keine Antwort');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Erwartete Antwort');
    expect(container.textContent).toContain('Antwort fehlt');
    expect(container.textContent).toContain(
      'Spieler müssen diese Antwort eingeben',
    );
    expect(container.textContent).toContain('Schreibweise flexibel');
    expect(container.textContent).toContain('Groß-/Kleinschreibung beachten');
    expect(container.textContent).not.toContain('Weitere Antworten');

    changeTextValue('Turm');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      answer: 'Turm',
      caseSensitive: false,
    });
  });

  it('renders multi_choice authoring helpers and guided answer selection', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={multiChoiceInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Auswahlfrage');
    expect(container.textContent).toContain('hat noch keine Antwortoptionen');
    expect(container.textContent).toContain('hat noch keine richtige Option');
    expect(container.textContent).toContain('Welche Symbole siehst du?');
    expect(container.textContent).toContain('Option 1');
    expect(container.textContent).toContain(
      'Noch keine Antwortoptionen festgelegt',
    );

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Mehrere richtige Antworten erlauben');
    expect(container.textContent).toContain('Option hinzufügen');
    expect(container.textContent).toContain('Richtig');

    changeTextValueAt(0, 'Welche Farbe hat das Schild?');

    expect(onChange).toHaveBeenCalledTimes(1);
    let nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      question: 'Welche Farbe hat das Schild?',
    });

    changeTextValueAt(1, 'Rot');

    nextInteraction = onChange.mock.calls[1][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      options: ['Rot', ''],
    });

    const correctInputs = Array.from(
      container.querySelectorAll('input[aria-label$="als richtig markieren"]'),
    );
    const correctInput = correctInputs[1];
    if (!(correctInput instanceof HTMLInputElement)) {
      throw new Error('Correct option input not found');
    }

    act(() => {
      correctInput.click();
    });

    nextInteraction = onChange.mock.calls[2][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      correctOptionIndexes: [1],
    });
  });

  it('renders qr_scan authoring configuration and empty value warnings', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor interaction={qrScanInteraction} onChange={onChange} />,
    );

    expect(container.textContent).toContain('QR-Code scannen');
    expect(container.textContent).toContain('hat noch keinen erwarteten QR-Wert');
    expect(container.textContent).toContain('Der Spieler scannt den vorgesehenen QR-Code.');
    expect(container.textContent).toContain('Simulierter QR-Wert');
    expect(container.textContent).toContain('Kamera wird benötigt');
    expect(container.textContent).toContain('Kamera aktivieren');
    expect(container.textContent).toContain('Kamera nicht verfügbar');
    expect(container.textContent).toContain('QR-Code konnte nicht gelesen werden');
    expect(container.textContent).toContain('Ersatzlösung verwenden');
    expect(container.textContent).toContain(
      'Noch kein erwarteter QR-Wert festgelegt',
    );

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Erwarteter QR-Wert');
    expect(container.textContent).toContain('QR-Wert fehlt');
    expect(container.textContent).toContain(
      'später mit dem gescannten QR-Code verglichen',
    );
    expect(container.textContent).toContain(
      'Der geführte Test bleibt über den simulierten QR-Wert bedienbar',
    );

    changeTextValue('station-3-gate');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      expectedValue: 'station-3-gate',
    });
  });

  it('renders code_word authoring helpers and guided test input', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={codeWordInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Codewort eingeben');
    expect(container.textContent).toContain('hat noch kein Codewort');
    expect(container.textContent).toContain(
      'Der Spieler gibt das gefundene Codewort ein.',
    );
    expect(container.textContent).toContain('Noch kein Codewort festgelegt');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Codewort fehlt');
    expect(container.textContent).toContain(
      'Spieler geben dieses Codewort ein',
    );
    expect(container.textContent).toContain('Schreibweise flexibel');
    expect(container.textContent).toContain('Groß-/Kleinschreibung beachten');

    changeTextValue('Adler');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      code: 'Adler',
      caseSensitive: false,
    });
  });

  it('renders sequential_code authoring helpers and guided test input', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={sequentialCodeInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Gesammelten Code eingeben');
    expect(container.textContent).toContain('hat noch keinen gesammelten Code');
    expect(container.textContent).toContain(
      'Der Spieler gibt den unterwegs gesammelten Code ein.',
    );
    expect(container.textContent).toContain(
      'Noch kein gesammelter Code festgelegt',
    );

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Code fehlt');
    expect(container.textContent).toContain(
      'Spieler geben den unterwegs gesammelten Code',
    );
    expect(container.textContent).toContain('Hinweis (optional)');
    expect(container.textContent).toContain('Schreibweise flexibel');

    changeTextValue('A1B2');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      code: 'A1B2',
      hint: '',
      caseSensitive: false,
    });
  });

  it('renders direction_hotcold authoring controls and guided heading simulation', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={directionHotcoldInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Richtung warm/kalt');
    expect(container.textContent).toContain(
      'Der Spieler dreht sich zur Zielrichtung und erhält warm/kalt-Feedback.',
    );
    expect(container.textContent).toContain('Richtung simulieren');
    expect(container.textContent).toContain('Kalt');

    clickButton('Zielrichtung simulieren');

    expect(container.textContent).toContain('Richtung korrekt');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Erfolgstoleranz');
    expect(container.textContent).toContain(
      'Außerhalb davon sehen Spieler warm/kalt-Feedback',
    );

    changeRangeValue('20');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      targetDegrees: 90,
      successTolerance: 20,
    });
  });

  it('renders proximity_hint authoring controls and guided GPS simulation', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={proximityHintInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Nähe-Hinweis');
    expect(container.textContent).toContain(
      'Der Spieler nähert sich dem Zielort und erhält Nähe-Hinweise.',
    );
    expect(container.textContent).toContain('Weit entfernt');

    clickButton('Innerhalb des Radius');

    expect(container.textContent).toContain('Im Zielradius');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Erfolgsradius');
    expect(container.textContent).toContain(
      'Außerhalb davon sehen Spieler Nähe-Hinweise',
    );

    changeRangeValue('35');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      lat: 46.4983,
      lng: 11.3548,
      successRadiusMeters: 35,
    });
  });

  it('renders timer_wait authoring controls and guided wait copy', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={timerWaitInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Warten');
    expect(container.textContent).toContain('Wartezeit');
    expect(container.textContent).toContain(
      'Der Spieler wartet, bis die konfigurierte Zeit abgelaufen ist.',
    );
    expect(container.textContent).toContain('Wartezeit startet: 3 s');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Wartezeit per Schieberegler');
    expect(container.textContent).toContain('10 s');
    expect(container.textContent).toContain('30 s');
    expect(container.textContent).not.toContain('Wartezeit in ms');

    toggleExpertMode();

    expect(container.textContent).toContain('Wartezeit in ms');

    clickButton('10 s');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      durationMs: 10000,
    });
  });

  it('renders object_found authoring helpers and guided confirmation', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={objectFoundInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Objekt gefunden');
    expect(container.textContent).toContain('hat noch keine Fund-Anweisung');
    expect(container.textContent).toContain(
      'Der Spieler bestätigt den Fund.',
    );
    expect(container.textContent).toContain('Gefunden');
    expect(container.textContent).toContain('Noch keine Fund-Bestätigung');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Fund-Anweisung');
    expect(container.textContent).toContain('Anweisung fehlt');
    expect(container.textContent).toContain(
      'welches Objekt, Schild oder welcher Hinweis',
    );
    expect(container.textContent).toContain('Bestätigungstext');

    changeTextValue('Finde den roten Marker am Baum');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      prompt: 'Finde den roten Marker am Baum',
      confirmLabel: 'Gefunden',
    });
  });

  it('renders photo_check_manual authoring helpers and guided confirmation', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={photoCheckManualInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Foto-Aufgabe bestätigen');
    expect(container.textContent).toContain('hat noch keine Foto-Aufgabe');
    expect(container.textContent).toContain(
      'Der Spieler bestätigt die Foto-Aufgabe.',
    );
    expect(container.textContent).toContain('Bestätigt');
    expect(container.textContent).toContain('Noch keine Foto-Aufgabe');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Foto-Aufgabe');
    expect(container.textContent).toContain('Aufgabe fehlt');
    expect(container.textContent).toContain(
      'welches Foto aufgenommen oder verglichen',
    );
    expect(container.textContent).toContain('Bestätigungstext');

    changeTextValue('Vergleiche dein Foto mit dem Schild');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0].config).toMatchObject({
      prompt: 'Vergleiche dein Foto mit dem Schild',
      confirmLabel: 'Bestätigt',
    });
  });

  it('authors and displays module fallback relations', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={fallbackInteraction}
        onChange={onChange}
      />,
    );

    expect(container.textContent).toContain('Ersatzlösung');
    expect(container.textContent).toContain('North code');
    expect(container.textContent).toContain(
      'Falls dieser Schritt auf dem Gerät nicht funktioniert',
    );
    expect(container.textContent).toContain(
      'diese Ersatzlösung verwendet werden.',
    );
    expect(container.textContent).toContain('Läuft');

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Ersatzlösung (Fallback)');
    expect(container.textContent).toContain('Keine Ersatzlösung');
    expect(container.textContent).toContain('Optionaler Baustein');

    changeSelectValue('Ersatzlösung (Fallback)', 'north_code');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    expect(nextInteraction.modules[0]).toMatchObject({
      id: 'face_north',
      fallbackModuleId: 'north_code',
    });
  });

  it('suggests and creates fallback modules for device-dependent modules', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={sequenceInteraction}
        onChange={onChange}
      />,
    );

    clickButton('Bearbeiten', 0);

    expect(container.textContent).toContain('Ersatzlösung empfohlen');
    expect(container.textContent).toContain('Codewort eingeben anlegen');
    expect(container.textContent).toContain('Objekt gefunden anlegen');

    clickButton('Codewort eingeben anlegen');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    const sourceModule = nextInteraction.modules.find(
      (module) => module.id === 'gps_enter_1',
    );
    const fallbackModule = nextInteraction.modules.find(
      (module) => module.id === sourceModule?.fallbackModuleId,
    );

    expect(nextInteraction.condition).toEqual(sequenceInteraction.condition);
    expect(sourceModule?.fallbackModuleId).toBeTruthy();
    expect(fallbackModule).toMatchObject({
      type: 'code_word',
      label: 'Codewort eingeben für Am richtigen Ort stehen',
      config: { code: '', caseSensitive: false },
    });
  });

  it('suggests object_found as a one-click fallback for photo checks', () => {
    const onChange = vi.fn();
    renderEditor(
      <RrrInteractionEditor
        interaction={photoCheckManualInteraction}
        onChange={onChange}
      />,
    );

    clickButton('Bearbeiten');

    expect(container.textContent).toContain('Ersatzlösung empfohlen');
    expect(container.textContent).toContain('Objekt gefunden anlegen');

    clickButton('Objekt gefunden anlegen');

    expect(onChange).toHaveBeenCalledTimes(1);
    const nextInteraction = onChange.mock.calls[0][0] as RrrInteraction;
    const sourceModule = nextInteraction.modules[0];
    const fallbackModule = nextInteraction.modules.find(
      (module) => module.id === sourceModule.fallbackModuleId,
    );

    expect(nextInteraction.condition).toEqual(
      photoCheckManualInteraction.condition,
    );
    expect(fallbackModule).toMatchObject({
      type: 'object_found',
      label: 'Objekt gefunden für Foto-Aufgabe bestätigen',
      config: { prompt: '', confirmLabel: 'Gefunden' },
    });
  });

  it('warns when a fallback relation points to a missing module', () => {
    const html = renderToStaticMarkup(
      <RrrInteractionEditor
        interaction={{
          ...fallbackInteraction,
          modules: [
            {
              ...fallbackInteraction.modules[0],
              fallbackModuleId: 'deleted_code',
            },
            fallbackInteraction.modules[1],
          ],
        }}
        onChange={() => {}}
      />,
    );

    expect(html).toContain(
      'Die Ersatzlösung verweist auf einen fehlenden Baustein.',
    );
    expect(html).toContain('Die Ersatzlösung fehlt oder wurde gelöscht.');
    expect(html).not.toContain('deleted_code');
  });
});

function renderEditor(element: ReactElement) {
  act(() => {
    root.render(element);
  });
}

function clickButton(label: string, index = 0) {
  const buttons = Array.from(container.querySelectorAll('button')).filter(
    (candidate) => candidate.textContent?.includes(label),
  );
  const button = buttons[index];
  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function changeRangeValue(value: string) {
  const input = container.querySelector('input[type="range"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Range input not found');
  }

  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function changeTextValue(value: string) {
  const input = container.querySelector('input[type="text"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Text input not found');
  }

  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function changeTextValueAt(index: number, value: string) {
  const input = Array.from(container.querySelectorAll('input[type="text"]'))[
    index
  ];
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Text input not found: ${index}`);
  }

  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function changeSelectValue(label: string, value: string) {
  const labels = Array.from(container.querySelectorAll('label'));
  const field = labels.find((candidate) =>
    candidate.textContent?.includes(label),
  );
  const select = field?.querySelector('select');
  if (!(select instanceof HTMLSelectElement)) {
    throw new Error(`Select not found: ${label}`);
  }

  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function changeSelectElementValue(select: HTMLSelectElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(select, value);
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function toggleExpertMode() {
  const input = container.querySelector('input[type="checkbox"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('Expert mode checkbox not found');
  }

  act(() => {
    input.click();
  });
}

const emptyInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [],
};

const sequenceInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'gps_enter_1',
      type: 'gps_enter',
      label: 'Am richtigen Ort stehen',
      config: { lat: 46.4983, lng: 11.3548, radiusMeters: 25 },
    },
    {
      id: 'face_north_1',
      type: 'compass_align',
      label: 'In Richtung Norden schauen',
      config: { targetDegrees: 0, tolerance: 15 },
    },
    {
      id: 'hold_still_1',
      type: 'hold_still',
      label: 'Handy ruhig halten',
      config: { durationMs: 3000 },
    },
  ],
  condition: {
    type: 'sequence',
    steps: [
      { type: 'module', moduleId: 'gps_enter_1' },
      { type: 'module', moduleId: 'face_north_1' },
      { type: 'module', moduleId: 'hold_still_1' },
    ],
  },
};

const textAnswerInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'text_answer_1',
      type: 'text_answer',
      label: 'Antwort eingeben',
      config: { answer: '', caseSensitive: false },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'text_answer_1',
  },
};

const multiChoiceInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'multi_choice_1',
      type: 'multi_choice',
      label: 'Auswahlfrage',
      config: {
        question: 'Welche Symbole siehst du?',
        options: ['', ''],
        correctOptionIndexes: [],
        allowMultiple: false,
      },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'multi_choice_1',
  },
};

const qrScanInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'qr_scan_1',
      type: 'qr_scan',
      label: 'QR-Code scannen',
      config: { expectedValue: '' },
      fallbackModuleId: 'qr_code_fallback',
    },
    {
      id: 'qr_code_fallback',
      type: 'code_word',
      label: 'QR Ersatzcode',
      config: { code: 'fallback', caseSensitive: false },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'qr_scan_1',
  },
};

const codeWordInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'code_word_1',
      type: 'code_word',
      label: 'Codewort eingeben',
      config: { code: '', caseSensitive: false },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'code_word_1',
  },
};

const sequentialCodeInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'sequential_code_1',
      type: 'sequential_code',
      label: 'Gesammelten Code eingeben',
      config: { code: '', hint: '', caseSensitive: false },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'sequential_code_1',
  },
};

const directionHotcoldInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'direction_hotcold_1',
      type: 'direction_hotcold',
      label: 'Richtung warm/kalt',
      config: { targetDegrees: 90, successTolerance: 15 },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'direction_hotcold_1',
  },
};

const proximityHintInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'proximity_hint_1',
      type: 'proximity_hint',
      label: 'Nähe-Hinweis',
      config: { lat: 46.4983, lng: 11.3548, successRadiusMeters: 20 },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'proximity_hint_1',
  },
};

const timerWaitInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'timer_wait_1',
      type: 'timer_wait',
      label: 'Warten',
      config: { durationMs: 3000 },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'timer_wait_1',
  },
};

const objectFoundInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'object_found_1',
      type: 'object_found',
      label: 'Objekt gefunden',
      config: { prompt: '', confirmLabel: 'Gefunden' },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'object_found_1',
  },
};

const photoCheckManualInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'photo_check_manual_1',
      type: 'photo_check_manual',
      label: 'Foto-Aufgabe bestätigen',
      config: { prompt: '', confirmLabel: 'Bestätigt' },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'photo_check_manual_1',
  },
};

const fallbackInteraction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'face_north',
      type: 'compass_align',
      label: 'Face north',
      config: { targetDegrees: 0, tolerance: 10 },
      fallbackModuleId: 'north_code',
    },
    {
      id: 'north_code',
      type: 'code_word',
      label: 'North code',
      config: { code: 'north', caseSensitive: false },
    },
  ],
  condition: {
    type: 'module',
    moduleId: 'face_north',
  },
};
