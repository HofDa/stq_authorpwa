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

  it('warns about missing fallback module references', () => {
    const warnings = getRrrAuthoringWarnings({
      schemaVersion: 1,
      modules: [
        {
          id: 'face_direction_1',
          type: 'compass_align',
          label: 'Face direction',
          config: { targetDegrees: 0, tolerance: 10 },
          fallbackModuleId: 'deleted_code',
        },
      ],
      condition: { type: 'module', moduleId: 'face_direction_1' },
    });

    expect(warnings).toEqual([
      {
        code: 'missing_fallback_reference',
        message:
          'Module "Face direction" references missing fallback module "deleted_code".',
        path: 'modules.0.fallbackModuleId',
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
          id: 'multi_choice_1',
          type: 'multi_choice',
          label: 'Choice',
          config: {
            question: '',
            options: ['', ''],
            correctOptionIndexes: [],
          },
        },
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
          id: 'direction_hotcold_1',
          type: 'direction_hotcold',
          label: 'Direction hot/cold',
          config: { targetDegrees: 0, successTolerance: 1 },
        },
        {
          id: 'proximity_hint_1',
          type: 'proximity_hint',
          label: 'Proximity hint',
          config: { lat: 0, lng: 0, successRadiusMeters: 1 },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 45000 },
        },
        {
          id: 'qr_scan_1',
          type: 'qr_scan',
          label: 'QR scan',
          config: { expectedValue: '' },
        },
        {
          id: 'code_word_1',
          type: 'code_word',
          label: 'Code word',
          config: { code: '' },
        },
        {
          id: 'sequential_code_1',
          type: 'sequential_code',
          label: 'Sequential code',
          config: { code: '' },
        },
        {
          id: 'timer_wait_1',
          type: 'timer_wait',
          label: 'Wait',
          config: { durationMs: 0 },
        },
        {
          id: 'timer_wait_2',
          type: 'timer_wait',
          label: 'Wait long',
          config: { durationMs: 90000 },
        },
        {
          id: 'object_found_1',
          type: 'object_found',
          label: 'Object found',
          config: { prompt: '' },
        },
        {
          id: 'photo_check_manual_1',
          type: 'photo_check_manual',
          label: 'Manual photo check',
          config: { prompt: '' },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    };

    expect(getRrrAuthoringWarnings(interaction).map((warning) => warning.code))
      .toEqual([
        'text_answer_empty',
        'multi_choice_question_empty',
        'multi_choice_options_empty',
        'multi_choice_correct_empty',
        'compass_tolerance_narrow',
        'gps_radius_small',
        'direction_tolerance_narrow',
        'proximity_radius_small',
        'hold_duration_long',
        'qr_scan_expected_value_empty',
        'code_word_empty',
        'sequential_code_empty',
        'timer_wait_duration_missing',
        'timer_wait_duration_long',
        'object_found_prompt_empty',
        'photo_check_manual_prompt_empty',
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
