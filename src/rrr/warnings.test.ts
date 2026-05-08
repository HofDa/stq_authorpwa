import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from './types';
import { getRrrWarnings, type RrrWarningCode } from './warnings';

function codes(interaction: RrrInteraction): RrrWarningCode[] {
  return getRrrWarnings(interaction).map((w) => w.code);
}

describe('getRrrWarnings', () => {
  it('flags an empty interaction', () => {
    const result = codes({ schemaVersion: 1, modules: [] });
    expect(result).toContain('no_modules');
    expect(result).toContain('no_condition');
  });

  it('detects a missing module reference', () => {
    const result = codes({
      schemaVersion: 1,
      modules: [],
      condition: { type: 'module', moduleId: 'ghost' },
    });
    expect(result).toContain('missing_module_reference');
  });

  it('detects a missing fallback module reference', () => {
    const result = getRrrWarnings({
      schemaVersion: 1,
      modules: [
        {
          id: 'compass_1',
          type: 'compass_align',
          label: 'Compass',
          config: { targetDegrees: 0, tolerance: 10 },
          fallbackModuleId: 'deleted_code',
        },
      ],
      condition: { type: 'module', moduleId: 'compass_1' },
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'missing_fallback_reference',
          moduleId: 'compass_1',
        }),
      ]),
    );
  });

  it('flags empty composite conditions', () => {
    const result = codes({
      schemaVersion: 1,
      modules: [],
      condition: { type: 'sequence', steps: [] },
    });
    expect(result).toContain('sequence_no_steps');

    const all = codes({
      schemaVersion: 1,
      modules: [],
      condition: { type: 'all_of', children: [] },
    });
    expect(all).toContain('all_of_no_children');

    const any = codes({
      schemaVersion: 1,
      modules: [],
      condition: { type: 'any_of', children: [] },
    });
    expect(any).toContain('any_of_no_children');
  });

  it('treats malformed composite conditions as empty instead of crashing', () => {
    const result = codes({
      schemaVersion: 1,
      modules: [],
      condition: { type: 'all_of' } as RrrInteraction['condition'],
    });

    expect(result).toContain('all_of_no_children');
  });

  it('flags risky module configs', () => {
    const result = codes({
      schemaVersion: 1,
      modules: [
        { id: 'a', type: 'text_answer', label: 'A', config: { answer: '' } },
        {
          id: 'aa',
          type: 'multi_choice',
          label: 'AA',
          config: {
            question: '',
            options: ['', ''],
            correctOptionIndexes: [],
          },
        },
        {
          id: 'b',
          type: 'compass_align',
          label: 'B',
          config: { tolerance: 1 },
        },
        {
          id: 'c',
          type: 'gps_enter',
          label: 'C',
          config: { radiusMeters: 1 },
        },
        {
          id: 'd',
          type: 'proximity_hint',
          label: 'D',
          config: { successRadiusMeters: 1 },
        },
        {
          id: 'e',
          type: 'direction_hotcold',
          label: 'E',
          config: { targetDegrees: Number.NaN, successTolerance: 1 },
        },
        {
          id: 'f',
          type: 'hold_still',
          label: 'F',
          config: { durationMs: 15000 },
        },
        {
          id: 'g',
          type: 'qr_scan',
          label: 'G',
          config: { expectedValue: '' },
        },
        {
          id: 'h',
          type: 'code_word',
          label: 'H',
          config: { code: '' },
        },
        {
          id: 'i',
          type: 'sequential_code',
          label: 'I',
          config: { code: '' },
        },
        {
          id: 'j',
          type: 'timer_wait',
          label: 'J',
          config: { durationMs: 0 },
        },
        {
          id: 'k',
          type: 'timer_wait',
          label: 'K',
          config: { durationMs: 90000 },
        },
        {
          id: 'l',
          type: 'object_found',
          label: 'L',
          config: { prompt: '' },
        },
        {
          id: 'm',
          type: 'photo_check_manual',
          label: 'M',
          config: { prompt: '' },
        },
      ],
    });

    expect(result).toContain('text_answer_empty');
    expect(result).toContain('multi_choice_question_empty');
    expect(result).toContain('multi_choice_options_empty');
    expect(result).toContain('multi_choice_correct_empty');
    expect(result).toContain('compass_target_invalid');
    expect(result).toContain('compass_tolerance_narrow');
    expect(result).toContain('direction_target_invalid');
    expect(result).toContain('direction_tolerance_narrow');
    expect(result).toContain('gps_missing_coordinates');
    expect(result).toContain('gps_radius_small');
    expect(result).toContain('proximity_missing_coordinates');
    expect(result).toContain('proximity_radius_small');
    expect(result).toContain('hold_duration_long');
    expect(result).toContain('qr_scan_expected_value_empty');
    expect(result).toContain('code_word_empty');
    expect(result).toContain('sequential_code_empty');
    expect(result).toContain('timer_wait_duration_missing');
    expect(result).toContain('timer_wait_duration_long');
    expect(result).toContain('object_found_prompt_empty');
    expect(result).toContain('photo_check_manual_prompt_empty');
  });

  it('attaches moduleId to module-level warnings', () => {
    const warnings = getRrrWarnings({
      schemaVersion: 1,
      modules: [
        { id: 'm1', type: 'text_answer', label: 'M1', config: { answer: '' } },
      ],
    });
    const textWarning = warnings.find((w) => w.code === 'text_answer_empty');
    expect(textWarning?.moduleId).toBe('m1');
  });

  it('returns no warnings for a complete valid interaction', () => {
    const result = codes({
      schemaVersion: 1,
      modules: [
        {
          id: 'a',
          type: 'text_answer',
          label: 'A',
          config: { answer: 'Eiffel' },
        },
      ],
      condition: { type: 'module', moduleId: 'a' },
    });
    expect(result).toEqual([]);
  });
});
