import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from './types';
import { getRrrAuthoringWarnings } from './authoringWarnings';

describe('getRrrAuthoringWarnings', () => {
  it('warns about empty interactions', () => {
    expect(
      getRrrAuthoringWarnings({
        schemaVersion: 1,
        modules: [],
      }).map((warning) => warning.code),
    ).toEqual(['no_modules', 'no_condition']);
  });

  it('warns about missing condition module references', () => {
    const warnings = getRrrAuthoringWarnings({
      schemaVersion: 1,
      modules: [textModule('module_1', 'tower')],
      condition: {
        type: 'sequence',
        steps: [
          { type: 'module', moduleId: 'module_1' },
          { type: 'module', moduleId: 'deleted_module' },
        ],
      },
    });

    expect(warnings).toEqual([
      {
        code: 'missing_module_reference',
        message: 'Condition references missing module "deleted_module".',
        path: 'condition.steps.1.moduleId',
      },
    ]);
  });

  it('does not crash on malformed composite conditions from draft JSON', () => {
    expect(
      getRrrAuthoringWarnings({
        schemaVersion: 1,
        modules: [textModule('module_1', 'tower')],
        condition: { type: 'sequence' } as RrrInteraction['condition'],
      }),
    ).toEqual([]);
  });

  it('warns about fragile module config values', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        textModule('module_1', ''),
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Face direction',
          config: { targetDegrees: 0, tolerance: 2 },
        },
        {
          id: 'gps_enter_1',
          type: 'gps_enter',
          label: 'Enter GPS radius',
          config: { lat: 0, lng: 0, radiusMeters: 1 },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 45000 },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    };

    expect(getRrrAuthoringWarnings(interaction).map((warning) => warning.code))
      .toEqual([
        'text_answer_empty',
        'compass_tolerance_narrow',
        'gps_radius_small',
        'hold_duration_long',
      ]);
  });

  it('does not warn for a complete baseline interaction', () => {
    expect(
      getRrrAuthoringWarnings({
        schemaVersion: 1,
        modules: [textModule('module_1', 'tower')],
        condition: { type: 'module', moduleId: 'module_1' },
      }),
    ).toEqual([]);
  });
});

function textModule(id: string, answer: string): RrrInteraction['modules'][number] {
  return {
    id,
    type: 'text_answer',
    label: 'Text answer',
    config: { answer, caseSensitive: false },
  };
}
