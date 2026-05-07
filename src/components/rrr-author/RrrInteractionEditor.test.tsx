import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { RrrInteractionEditor } from './RrrInteractionEditor';

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
});

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
