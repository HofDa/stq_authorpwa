import type { RrrInteraction } from './types';

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
    label: 'Simple text answer',
    description: 'One text answer module as the success condition.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Text answer',
          config: { answer: '', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    }),
  },
  {
    id: 'face_direction',
    label: 'Face direction',
    description: 'One compass module that succeeds near the target heading.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Face direction',
          config: { targetDegrees: 0, tolerance: 15 },
        },
      ],
      condition: { type: 'module', moduleId: 'face_direction_1' },
    }),
  },
  {
    id: 'compass_hold',
    label: 'Face direction and hold still',
    description: 'Compass alignment and stillness must both succeed.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Face direction',
          config: { targetDegrees: 0, tolerance: 15 },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
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
    label: 'GPS area then compass',
    description: 'Enter a GPS radius first, then face the target direction.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'gps_enter_1',
          type: 'gps_enter',
          label: 'Enter GPS radius',
          config: { lat: 46.4983, lng: 11.3548, radiusMeters: 25 },
        },
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Face direction',
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
    label: 'Alternative solution: QR/text later placeholder',
    description:
      'Schema-valid placeholder using text modules until a QR module exists.',
    createInteraction: () => ({
      schemaVersion: 1,
      modules: [
        {
          id: 'text_answer_1',
          type: 'text_answer',
          label: 'Text fallback',
          config: { answer: '', caseSensitive: false },
        },
        {
          id: 'qr_placeholder_1',
          type: 'text_answer',
          label: 'QR placeholder',
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
