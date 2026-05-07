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
          type: 'hold_still',
          label: 'D',
          config: { durationMs: 15000 },
        },
      ],
    });

    expect(result).toContain('text_answer_empty');
    expect(result).toContain('compass_target_invalid');
    expect(result).toContain('compass_tolerance_narrow');
    expect(result).toContain('gps_missing_coordinates');
    expect(result).toContain('gps_radius_small');
    expect(result).toContain('hold_duration_long');
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
