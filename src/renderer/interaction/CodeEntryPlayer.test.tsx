/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeEntryPlayer } from './CodeEntryPlayer';

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

describe('CodeEntryPlayer', () => {
  it('submits matching code_word values', () => {
    const onCorrect = vi.fn();

    render(
      <CodeEntryPlayer
        expectedCode="Adler"
        variant="code_word"
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Codewort');
    expect(container.textContent).toContain('Codewort eingeben');

    changeTextValue('adler');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('passt nicht');
  });

  it('respects case-sensitive sequential codes', () => {
    const onCorrect = vi.fn();

    render(
      <CodeEntryPlayer
        expectedCode="A1B2"
        caseSensitive
        variant="sequential_code"
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    changeTextValue('a1b2');
    clickButton('Prüfen');

    expect(onCorrect).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Der gesammelte Code passt nicht.');

    changeTextValue('A1B2');
    clickButton('Prüfen');

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
