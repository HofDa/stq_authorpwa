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

vi.mock('@/components/rrr-runtime/useLiveDeviceHeading', () => ({
  useLiveDeviceHeading: () => liveHeadingState,
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
