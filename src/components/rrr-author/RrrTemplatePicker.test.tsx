/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import { RrrTemplatePicker } from './RrrTemplatePicker';

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

describe('RrrTemplatePicker', () => {
  it('renders the template-first wizard', () => {
    renderPicker(
      <RrrTemplatePicker
        hasExistingInteraction={false}
        variant="wizard"
        onApply={vi.fn()}
      />,
    );

    expect(container.textContent).toContain('Mit Vorlage starten');
    expect(container.textContent).toContain('Frage mit Antwort');
    expect(container.textContent).toContain('Am richtigen Ort stehen');
    expect(container.textContent).toContain('In eine Richtung schauen');
    expect(container.textContent).toContain(
      'Richtung finden und Handy ruhig halten',
    );
    expect(container.textContent).toContain('Ort erreichen, dann Richtung finden');
  });

  it('applies a valid template from the wizard', () => {
    const onApply = vi.fn();
    renderPicker(
      <RrrTemplatePicker
        hasExistingInteraction={false}
        variant="wizard"
        onApply={onApply}
      />,
    );

    clickButton('Am richtigen Ort stehen');

    expect(onApply).toHaveBeenCalledTimes(1);
    const interaction = onApply.mock.calls[0][0];
    expect(RrrInteractionSchema.safeParse(interaction).success).toBe(true);
    expect(interaction.modules[0].type).toBe('gps_enter');
  });

  it('does not replace existing interactions without confirmation', () => {
    const onApply = vi.fn();
    const confirmReplace = vi.fn(() => false);
    renderPicker(
      <RrrTemplatePicker
        hasExistingInteraction
        confirmReplace={confirmReplace}
        variant="wizard"
        onApply={onApply}
      />,
    );

    clickButton('Frage mit Antwort');

    expect(confirmReplace).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });
});

function renderPicker(element: ReactElement) {
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
