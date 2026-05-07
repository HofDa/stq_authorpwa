import { describe, expect, it } from 'vitest';
import type { RrrCondition } from '@/rrr';
import { evaluateCondition } from './evaluateCondition';
import type { RrrRuntimeStatus } from './types';

describe('evaluateCondition', () => {
  it('returns idle without a condition', () => {
    expect(evaluateCondition(undefined, new Map()).status).toBe('idle');
  });

  it('evaluates module conditions', () => {
    const condition: RrrCondition = { type: 'module', moduleId: 'module_1' };

    expect(evaluateCondition(condition, statuses({ module_1: 'success' })).status)
      .toBe('success');
    expect(evaluateCondition(condition, statuses({ module_1: 'failed' })).status)
      .toBe('failed');
    expect(evaluateCondition(condition, statuses({})).status).toBe('failed');
  });

  it('evaluates sequence conditions', () => {
    const condition: RrrCondition = {
      type: 'sequence',
      steps: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };

    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'success', module_2: 'success' }),
      ).status,
    ).toBe('running');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'success', module_2: 'running' }),
      ).status,
    ).toBe('running');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'failed', module_2: 'success' }),
      ).status,
    ).toBe('failed');
  });

  it('evaluates all_of conditions', () => {
    const condition: RrrCondition = {
      type: 'all_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };

    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'success', module_2: 'success' }),
      ).status,
    ).toBe('success');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'success', module_2: 'running' }),
      ).status,
    ).toBe('running');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'success', module_2: 'failed' }),
      ).status,
    ).toBe('failed');
  });

  it('evaluates any_of conditions', () => {
    const condition: RrrCondition = {
      type: 'any_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };

    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'failed', module_2: 'success' }),
      ).status,
    ).toBe('success');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'running', module_2: 'failed' }),
      ).status,
    ).toBe('running');
    expect(
      evaluateCondition(
        condition,
        statuses({ module_1: 'failed', module_2: 'failed' }),
      ).status,
    ).toBe('failed');
  });

  it('does not crash on malformed composite conditions from draft JSON', () => {
    const malformedAllOf = { type: 'all_of' } as RrrCondition;
    const malformedSequence = { type: 'sequence' } as RrrCondition;

    expect(evaluateCondition(malformedAllOf, statuses({})).status).toBe('idle');
    expect(evaluateCondition(malformedSequence, statuses({})).status).toBe(
      'idle',
    );
  });
});

function statuses(
  values: Record<string, RrrRuntimeStatus>,
): ReadonlyMap<string, RrrRuntimeStatus> {
  return new Map(Object.entries(values));
}
