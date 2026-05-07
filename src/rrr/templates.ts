import type { RrrInteraction } from './types';
import compassHoldExample from './examples/compass-hold.example.json';
import gpsCompassSequenceExample from './examples/gps-compass-sequence.example.json';
import textAnswerExample from './examples/text-answer.example.json';

export type RrrTemplateId =
  | 'simple_text_answer'
  | 'gps_only'
  | 'compass_only'
  | 'compass_then_hold_still'
  | 'gps_then_compass';

export interface RrrTemplate {
  id: RrrTemplateId;
  label: string;
  description: string;
  interaction: RrrInteraction;
}

const compassOnly: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'face_direction_1',
      type: 'compass_align',
      label: 'Richtung finden',
      config: { targetDegrees: 0, tolerance: 15 },
    },
  ],
  condition: { type: 'module', moduleId: 'face_direction_1' },
};

const gpsOnly: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'gps_enter_1',
      type: 'gps_enter',
      label: 'Ort erreichen',
      config: { lat: 0, lng: 0, radiusMeters: 20 },
    },
  ],
  condition: { type: 'module', moduleId: 'gps_enter_1' },
};

export const RRR_TEMPLATES: readonly RrrTemplate[] = [
  {
    id: 'simple_text_answer',
    label: 'Frage mit Antwort',
    description: 'Eine geschriebene Antwort löst das Rätsel.',
    interaction: textAnswerExample as RrrInteraction,
  },
  {
    id: 'gps_only',
    label: 'Am richtigen Ort stehen',
    description: 'Der Zielbereich auf der Karte löst das Rätsel.',
    interaction: gpsOnly,
  },
  {
    id: 'compass_only',
    label: 'In eine Richtung schauen',
    description: 'Die Zielrichtung löst das Rätsel.',
    interaction: compassOnly,
  },
  {
    id: 'compass_then_hold_still',
    label: 'Richtung finden und Handy ruhig halten',
    description: 'Richtung und Stillhalten müssen beide erfüllt sein.',
    interaction: compassHoldExample as RrrInteraction,
  },
  {
    id: 'gps_then_compass',
    label: 'Ort erreichen, dann Richtung finden',
    description: 'Erst den Zielbereich erreichen, dann die Zielrichtung finden.',
    interaction: gpsCompassSequenceExample as RrrInteraction,
  },
] as const;

export function getRrrTemplate(id: RrrTemplateId): RrrTemplate {
  const template = RRR_TEMPLATES.find((entry) => entry.id === id);
  if (!template) {
    throw new Error(`Unknown RRR template: ${id}`);
  }
  return template;
}
