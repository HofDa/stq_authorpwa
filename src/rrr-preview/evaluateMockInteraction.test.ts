import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { evaluateMockInteraction } from './evaluateMockInteraction';
import type { RrrMockInputs } from './types';

const baseInputs: RrrMockInputs = {
  headingDegrees: 0,
  gpsLat: 0,
  gpsLng: 0,
  isStill: false,
  textAnswer: '',
};

describe('evaluateMockInteraction', () => {
  it('simulates a compass module', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'face_north_1',
          type: 'compass_align',
          label: 'Face north',
          config: { targetDegrees: 0, tolerance: 10 },
        },
      ],
      condition: { type: 'module', moduleId: 'face_north_1' },
    };

    const aligned = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 355,
    });
    const away = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 45,
    });

    expect(aligned.modules.face_north_1.status).toBe('success');
    expect(aligned.status).toBe('success');
    expect(away.modules.face_north_1.status).toBe('running');
    expect(away.status).toBe('running');
  });

  it('simulates hold still', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 3000 },
        },
      ],
      condition: { type: 'module', moduleId: 'hold_still_1' },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        isStill: true,
      }).status,
    ).toBe('success');
  });

  it('simulates a text answer module', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'Tower',
      }).status,
    ).toBe('success');
  });

  it('combines module statuses through all_of', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower' },
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
          { type: 'module', moduleId: 'module_1' },
          { type: 'module', moduleId: 'hold_still_1' },
        ],
      },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'tower',
        isStill: true,
      }).status,
    ).toBe('success');
    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'wrong',
        isStill: true,
      }).status,
    ).toBe('failed');
  });

  it('reads nested condition trees with sequence steps', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower' },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 3000 },
        },
      ],
      condition: {
        type: 'sequence',
        steps: [
          { type: 'module', moduleId: 'module_1' },
          {
            type: 'all_of',
            children: [{ type: 'module', moduleId: 'hold_still_1' }],
          },
        ],
      },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'tower',
        isStill: true,
      }).status,
    ).toBe('running');
  });
});
