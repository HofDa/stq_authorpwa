import type { RrrInteraction } from './types';
import compassHoldExample from './examples/compass-hold.example.json';
import gpsCompassSequenceExample from './examples/gps-compass-sequence.example.json';
import textAnswerExample from './examples/text-answer.example.json';

export type RrrTemplateId =
  | 'simple_text_answer'
  | 'compass_only'
  | 'compass_then_hold_still'
  | 'gps_then_compass'
  | 'any_text_or_compass';

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
      label: 'Face direction',
      config: { targetDegrees: 0, tolerance: 15 },
    },
  ],
  condition: { type: 'module', moduleId: 'face_direction_1' },
};

const anyTextOrCompass: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'text_answer_1',
      type: 'text_answer',
      label: 'Text answer',
      config: { answer: '', caseSensitive: false },
    },
    {
      id: 'face_direction_1',
      type: 'compass_align',
      label: 'Face direction',
      config: { targetDegrees: 0, tolerance: 15 },
    },
  ],
  condition: {
    type: 'any_of',
    children: [
      { type: 'module', moduleId: 'text_answer_1' },
      { type: 'module', moduleId: 'face_direction_1' },
    ],
  },
};

export const RRR_TEMPLATES: readonly RrrTemplate[] = [
  {
    id: 'simple_text_answer',
    label: 'Simple text answer',
    description: 'A single text-answer module is the only success condition.',
    interaction: textAnswerExample as RrrInteraction,
  },
  {
    id: 'compass_only',
    label: 'Compass only',
    description: 'One compass module that succeeds near the target heading.',
    interaction: compassOnly,
  },
  {
    id: 'compass_then_hold_still',
    label: 'Compass then hold still',
    description: 'Face the right direction, then keep the device still.',
    interaction: compassHoldExample as RrrInteraction,
  },
  {
    id: 'gps_then_compass',
    label: 'GPS then compass',
    description: 'Reach the GPS radius first, then face the target direction.',
    interaction: gpsCompassSequenceExample as RrrInteraction,
  },
  {
    id: 'any_text_or_compass',
    label: 'Any of text answer or compass',
    description:
      'Either a text answer or facing the right direction satisfies the riddle.',
    interaction: anyTextOrCompass,
  },
] as const;

export function getRrrTemplate(id: RrrTemplateId): RrrTemplate {
  const template = RRR_TEMPLATES.find((entry) => entry.id === id);
  if (!template) {
    throw new Error(`Unknown RRR template: ${id}`);
  }
  return template;
}
