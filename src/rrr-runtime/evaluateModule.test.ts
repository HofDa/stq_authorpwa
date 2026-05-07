import { describe, expect, it } from 'vitest';
import type { RrrModule } from '@/rrr';
import { evaluateModule } from './evaluateModule';
import type { RrrRuntimeEvaluationInput } from './types';

const baseInput: RrrRuntimeEvaluationInput = {
  mockState: {},
  userInput: {},
};

describe('evaluateModule', () => {
  it('evaluates text_answer modules', () => {
    const module = textModule({ answer: 'tower', caseSensitive: false });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { textAnswer: 'Tower' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { textAnswer: 'gate' },
      }).status,
    ).toBe('failed');
  });

  it('evaluates compass_align modules', () => {
    const module = moduleWithConfig('compass_align', {
      targetDegrees: 0,
      tolerance: 10,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { headingDegrees: 355 },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { headingDegrees: 45 },
      }).status,
    ).toBe('running');
  });

  it('evaluates hold_still modules', () => {
    const module = moduleWithConfig('hold_still', { durationMs: 3000 });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { isStill: true },
      }).status,
    ).toBe('success');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('evaluates gps_enter modules', () => {
    const module = moduleWithConfig('gps_enter', {
      lat: 46.4983,
      lng: 11.3548,
      radiusMeters: 25,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { gpsLat: 46.4983, gpsLng: 11.3548 },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { gpsLat: 46.5, gpsLng: 11.36 },
      }).status,
    ).toBe('running');
  });
});

function textModule(config: Record<string, unknown>): RrrModule {
  return {
    id: 'module_1',
    type: 'text_answer',
    label: 'Text answer',
    config,
  };
}

function moduleWithConfig(
  type: Exclude<RrrModule['type'], 'text_answer'>,
  config: Record<string, unknown>,
): RrrModule {
  return {
    id: `${type}_1`,
    type,
    label: type,
    config,
  };
}
