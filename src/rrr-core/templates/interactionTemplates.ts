import type { RrrInteraction } from '../types';

export type RrrInteractionTemplateId =
  | 'simple_text_answer'
  | 'face_direction'
  | 'compass_hold'
  | 'gps_compass_sequence'
  | 'qr_text_placeholder';

export interface RrrInteractionTemplate {
  id: RrrInteractionTemplateId;
  label: string;
  description: string;
  createInteraction: () => RrrInteraction;
}

export const RRR_INTERACTION_TEMPLATES: RrrInteractionTemplate[] = [
  {
    id: 'simple_text_answer',
    label: 'Einfache Textantwort',
    description: 'Ein Text-Baustein reicht zum Lösen.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Textantwort',
          config: { answer: '', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    }),
  },
  {
    id: 'face_direction',
    label: 'Richtung finden',
    description: 'Ein Richtungs-Baustein wird nahe der Zielrichtung erfüllt.',
    createInteraction: () => ({
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
    }),
  },
  {
    id: 'compass_hold',
    label: 'Richtung finden und stillhalten',
    description: 'Richtung und Stillhalten müssen beide erfüllt sein.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Richtung finden',
          config: { targetDegrees: 0, tolerance: 15 },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Stillhalten',
          config: { durationMs: 3000 },
        },
      ],
      condition: {
        type: 'all_of',
        children: [
          { type: 'module', moduleId: 'face_direction_1' },
          { type: 'module', moduleId: 'hold_still_1' },
        ],
      },
    }),
  },
  {
    id: 'gps_compass_sequence',
    label: 'Ort erreichen, dann Richtung finden',
    description: 'Erst den Zielbereich erreichen, dann die Zielrichtung finden.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'gps_enter_1',
          type: 'gps_enter',
          label: 'Ort erreichen',
          config: { lat: 46.4983, lng: 11.3548, radiusMeters: 25 },
        },
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Richtung finden',
          config: { targetDegrees: 180, tolerance: 20 },
        },
      ],
      condition: {
        type: 'sequence',
        steps: [
          { type: 'module', moduleId: 'gps_enter_1' },
          { type: 'module', moduleId: 'face_direction_1' },
        ],
      },
    }),
  },
  {
    id: 'qr_text_placeholder',
    label: 'Alternative Lösung: Platzhalter',
    description:
      'Gültiger Platzhalter mit Text-Bausteinen, bis QR verfügbar ist.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'text_answer_1',
          type: 'text_answer',
          label: 'Text-Ersatz',
          config: { answer: '', caseSensitive: false },
        },
        {
          id: 'qr_placeholder_1',
          type: 'text_answer',
          label: 'QR-Platzhalter',
          config: { answer: '', caseSensitive: false },
        },
      ],
      condition: {
        type: 'any_of',
        children: [
          { type: 'module', moduleId: 'text_answer_1' },
          { type: 'module', moduleId: 'qr_placeholder_1' },
        ],
      },
    }),
  },
];

export function getRrrInteractionTemplate(
  id: RrrInteractionTemplateId,
): RrrInteractionTemplate {
  const template = RRR_INTERACTION_TEMPLATES.find((item) => item.id === id);
  if (!template) {
    throw new Error(`Unknown RRR interaction template: ${id}`);
  }
  return template;
}
