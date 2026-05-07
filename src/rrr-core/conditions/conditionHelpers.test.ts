import { describe, expect, it } from 'vitest';
import type { RrrCondition } from '../types';
import {
  buildFlatCondition,
  conditionToFlatModuleIds,
  getConditionChildren,
  isFlatCondition,
} from './conditionHelpers';

describe('RRR condition helpers', () => {
  it('builds flat conditions from module ids', () => {
    expect(buildFlatCondition('none', ['a'])).toBeUndefined();
    expect(buildFlatCondition('module', ['a'])).toEqual({
      type: 'module',
      moduleId: 'a',
    });
    expect(buildFlatCondition('sequence', ['a', 'b'])).toEqual({
      type: 'sequence',
      children: [
        { type: 'module', moduleId: 'a' },
        { type: 'module', moduleId: 'b' },
      ],
    });
    expect(buildFlatCondition('all_of', ['a', ''])).toEqual({
      type: 'all_of',
      children: [{ type: 'module', moduleId: 'a' }],
    });
  });

  it('collects module ids from condition trees', () => {
    const condition: RrrCondition = {
      type: 'any_of',
      children: [
        { type: 'module', moduleId: 'a' },
        {
          type: 'sequence',
          steps: [{ type: 'module', moduleId: 'b' }],
        },
      ],
    };

    expect(conditionToFlatModuleIds(condition)).toEqual(['a', 'b']);
  });

  it('detects flat conditions', () => {
    expect(
      isFlatCondition({
        type: 'all_of',
        children: [{ type: 'module', moduleId: 'a' }],
      }),
    ).toBe(true);
    expect(
      isFlatCondition({
        type: 'all_of',
        children: [
          {
            type: 'any_of',
            children: [{ type: 'module', moduleId: 'a' }],
          },
        ],
      }),
    ).toBe(false);
  });

  it('returns an empty child list for module and malformed composite nodes', () => {
    expect(getConditionChildren({ type: 'module', moduleId: 'a' })).toEqual([]);
    expect(getConditionChildren({ type: 'sequence' } as RrrCondition)).toEqual(
      [],
    );
    expect(getConditionChildren({ type: 'all_of' } as RrrCondition)).toEqual([]);
  });
});
