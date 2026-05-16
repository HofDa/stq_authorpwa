/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MorseCodePlayer } from './MorseCodePlayer';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal('Audio', undefined);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe('MorseCodePlayer', () => {
  it('submits matching short and long button input', () => {
    const onCorrect = vi.fn();

    render(
      <MorseCodePlayer
        expectedPattern=".-"
        shortAudioUrl=""
        longAudioUrl=""
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Morsecode nachbauen');

    clickButton('Kurz');
    clickButton('Lang');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('passt nicht');
  });

  it('shows an error for wrong morse input', () => {
    const onCorrect = vi.fn();

    render(
      <MorseCodePlayer
        expectedPattern="--"
        shortAudioUrl=""
        longAudioUrl=""
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    clickButton('Kurz');
    clickButton('Prüfen');

    expect(onCorrect).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Der Morsecode passt nicht.');
  });
});

function render(element: ReactElement) {
  act(() => {
    root.render(element);
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
