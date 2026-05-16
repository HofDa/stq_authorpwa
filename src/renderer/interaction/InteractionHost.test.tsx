/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RrrInteraction } from '@/rrr/types';
import { InteractionHost, type InteractionHostLabels } from './InteractionHost';

const liveHeadingState = vi.hoisted(() => ({
  heading: undefined as number | undefined,
  status: 'idle' as 'idle' | 'starting' | 'available' | 'unavailable' | 'error',
  start: vi.fn(),
}));

const liveGeolocationState = vi.hoisted(() => ({
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  accuracy: undefined as number | undefined,
  status: 'idle' as 'idle' | 'starting' | 'available' | 'unavailable' | 'error',
  start: vi.fn(),
}));

const liveBalanceState = vi.hoisted(() => ({
  tiltX: undefined as number | undefined,
  tiltY: undefined as number | undefined,
  magnitude: undefined as number | undefined,
  status: 'idle' as 'idle' | 'starting' | 'available' | 'unavailable' | 'error',
  start: vi.fn(),
}));

vi.mock('@/components/rrr-runtime/useLiveDeviceHeading', () => ({
  useLiveDeviceHeading: () => liveHeadingState,
}));

vi.mock('@/components/rrr-runtime/useLiveDeviceBalance', () => ({
  useLiveDeviceBalance: () => liveBalanceState,
}));

vi.mock('@/components/rrr-runtime/useLiveGeolocation', () => ({
  useLiveGeolocation: () => liveGeolocationState,
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const labels: InteractionHostLabels = {
  submit: 'Prüfen',
  compassEnable: 'Kompass aktivieren',
  compassStarting: 'Kompass wird gestartet',
  compassUnavailable: 'Kompass nicht verfügbar',
  compassDenied: 'Kompass verweigert',
  compassAligned: 'Ausrichtung gehalten',
  compassAlign: 'Richte das Gerät aus',
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('Audio', undefined);
  liveHeadingState.heading = undefined;
  liveHeadingState.status = 'idle';
  liveHeadingState.start.mockClear();
  liveGeolocationState.latitude = undefined;
  liveGeolocationState.longitude = undefined;
  liveGeolocationState.accuracy = undefined;
  liveGeolocationState.status = 'idle';
  liveGeolocationState.start.mockClear();
  liveBalanceState.tiltX = undefined;
  liveBalanceState.tiltY = undefined;
  liveBalanceState.magnitude = undefined;
  liveBalanceState.status = 'idle';
  liveBalanceState.start.mockClear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('InteractionHost', () => {
  it('renders the module selected by a single-module condition', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'text_answer_1',
          type: 'text_answer',
          label: 'Textantwort',
          config: { answer: 'legacy' },
        },
        {
          id: 'code_word_1',
          type: 'code_word',
          label: 'Codewort eingeben',
          config: { code: 'Adler', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'code_word_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Codewort eingeben');
    expect(container.textContent).not.toContain('Antwort eingeben');
  });

  it('uses configured text_answer values from modular interactions', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'text_answer_1',
          type: 'text_answer',
          label: 'Textantwort',
          config: { answer: 'Adler' },
        },
      ],
      condition: { type: 'module', moduleId: 'text_answer_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={['wrong-legacy-answer']}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    changeTextValue('adler');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('uses configured code_word values instead of legacy accepted answers', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'code_word_1',
          type: 'code_word',
          label: 'Codewort eingeben',
          config: { code: 'Adler', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'code_word_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={['wrong-legacy-answer']}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    changeTextValue('adler');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders morse_code modules from configured patterns', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'morse_code_1',
          type: 'morse_code',
          label: 'Morsecode hören',
          config: { pattern: '.-', shortAudioUrl: '', longAudioUrl: '' },
        },
      ],
      condition: { type: 'module', moduleId: 'morse_code_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    clickButton('Kurz');
    clickButton('Lang');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders direction_hotcold modules with the warm/cold visual', () => {
    liveHeadingState.heading = 45;
    liveHeadingState.status = 'available';
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'direction_hotcold_1',
          type: 'direction_hotcold',
          label: 'Richtung warm/kalt',
          config: { targetDegrees: 0, successTolerance: 10 },
        },
      ],
      condition: { type: 'module', moduleId: 'direction_hotcold_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Warm');
    expect(container.textContent).toContain('Richte das Gerät aus');
    expect(container.querySelector('.stq-rrr-hotcold--warm')).not.toBeNull();
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('renders safe_dial modules and completes after the hold time', () => {
    vi.useFakeTimers();
    liveHeadingState.heading = 30;
    liveHeadingState.status = 'available';
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'safe_dial_1',
          type: 'safe_dial',
          label: 'Tresor-Drehrad',
          config: { targetDegrees: 30, tolerance: 8, holdMs: 100 },
        },
      ],
      condition: { type: 'module', moduleId: 'safe_dial_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.querySelector('.stq-rrr-safe-dial--unlocked')).not.toBeNull();
    expect(container.textContent).toContain('Code halten');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders proximity_hint modules with the radar visual', () => {
    liveGeolocationState.latitude = 46.4983;
    liveGeolocationState.longitude = 11.3548;
    liveGeolocationState.status = 'available';
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'proximity_hint_1',
          type: 'proximity_hint',
          label: 'Naehe warm/kalt',
          config: {
            lat: 46.4983,
            lng: 11.3548,
            successRadiusMeters: 25,
          },
        },
      ],
      condition: { type: 'module', moduleId: 'proximity_hint_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Zielradius');
    expect(container.textContent).toContain('25 m');
    expect(container.querySelector('.stq-rrr-radar')).not.toBeNull();
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders balance_run modules with the balance visual', () => {
    liveGeolocationState.latitude = 46.4983;
    liveGeolocationState.longitude = 11.3548;
    liveGeolocationState.status = 'available';
    liveBalanceState.tiltX = 1;
    liveBalanceState.tiltY = 2;
    liveBalanceState.magnitude = 3;
    liveBalanceState.status = 'available';
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'balance_run_1',
          type: 'balance_run',
          label: 'Balance-Lauf',
          config: {
            startLat: 46.4983,
            startLng: 11.3548,
            targetLat: 46.499,
            targetLng: 11.356,
            successRadiusMeters: 20,
            timeLimitMs: 60000,
            maxTiltDegrees: 12,
          },
        },
      ],
      condition: { type: 'module', moduleId: 'balance_run_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.querySelector('.stq-rrr-balance-run')).not.toBeNull();
    expect(container.textContent).toContain('Balance-Lauf starten');
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('renders multi_choice modules with configured options', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'multi_choice_1',
          type: 'multi_choice',
          label: 'Auswahlfrage',
          config: {
            question: 'Welche Farbe?',
            options: ['Rot', 'Blau'],
            correctOptionIndexes: [1],
            allowMultiple: false,
          },
        },
      ],
      condition: { type: 'module', moduleId: 'multi_choice_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Welche Farbe?');
    clickLabelInput('Blau');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders gps_enter modules with the radar visual', () => {
    liveGeolocationState.latitude = 46.4983;
    liveGeolocationState.longitude = 11.3548;
    liveGeolocationState.status = 'available';
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'gps_enter_1',
          type: 'gps_enter',
          label: 'Ort erreichen',
          config: {
            lat: 46.4983,
            lng: 11.3548,
            radiusMeters: 25,
          },
        },
      ],
      condition: { type: 'module', moduleId: 'gps_enter_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.querySelector('.stq-rrr-radar')).not.toBeNull();
    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders hold_still modules and completes after the configured duration', () => {
    vi.useFakeTimers();
    liveBalanceState.status = 'available';
    liveBalanceState.magnitude = 0;
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Stillhalten',
          config: { durationMs: 500 },
        },
      ],
      condition: { type: 'module', moduleId: 'hold_still_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Ruhig halten');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders timer_wait modules and completes after the configured duration', () => {
    vi.useFakeTimers();
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'timer_wait_1',
          type: 'timer_wait',
          label: 'Warten',
          config: { durationMs: 1000 },
        },
      ],
      condition: { type: 'module', moduleId: 'timer_wait_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Wartezeit läuft');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders manual confirmation modules', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'photo_check_manual_1',
          type: 'photo_check_manual',
          label: 'Foto-Aufgabe bestätigen',
          config: { prompt: 'Zeig dein Foto.', confirmLabel: 'Erledigt' },
        },
      ],
      condition: { type: 'module', moduleId: 'photo_check_manual_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Zeig dein Foto.');
    clickButton('Erledigt');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });

  it('renders object_found modules', () => {
    const onCorrect = vi.fn();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'object_found_1',
          type: 'object_found',
          label: 'Objekt gefunden',
          config: { prompt: 'Finde das Schild.', confirmLabel: 'Gefunden' },
        },
      ],
      condition: { type: 'module', moduleId: 'object_found_1' },
    };

    render(
      <InteractionHost
        interaction={interaction}
        acceptedAnswers={[]}
        labels={labels}
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Finde das Schild.');
    clickButton('Gefunden');

    expect(onCorrect).toHaveBeenCalledTimes(1);
  });
});

function render(element: ReactElement) {
  act(() => {
    root.render(element);
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

function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function clickLabelInput(label: string) {
  const labelElement = Array.from(container.querySelectorAll('label')).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  const input = labelElement?.querySelector('input');
  if (!input) {
    throw new Error(`Input label not found: ${label}`);
  }

  act(() => {
    input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}
