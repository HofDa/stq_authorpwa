/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextAnswerPlayer } from './TextAnswerPlayer';

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

describe('TextAnswerPlayer', () => {
  it('renders the shared text answer visual and submits matching answers', () => {
    const onCorrect = vi.fn();

    render(
      <TextAnswerPlayer
        acceptedAnswers={['Turm']}
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    expect(container.textContent).toContain('Textantwort');
    expect(container.textContent).toContain('Antwort eingeben');

    changeTextValue('turm');
    clickButton('Prüfen');

    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('Nicht ganz');
  });

  it('shows module feedback for wrong answers and clears it while editing', () => {
    const onCorrect = vi.fn();

    render(
      <TextAnswerPlayer
        acceptedAnswers={['Turm']}
        submitLabel="Prüfen"
        onCorrect={onCorrect}
      />,
    );

    changeTextValue('Tor');
    clickButton('Prüfen');

    expect(onCorrect).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Nicht ganz');

    changeTextValue('Turm');

    expect(container.textContent).not.toContain('Nicht ganz');
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
