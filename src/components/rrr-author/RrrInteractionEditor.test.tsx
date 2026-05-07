/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RrrInteraction } from '@/rrr';
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
