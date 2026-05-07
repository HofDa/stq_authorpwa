import { describe, expect, it } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import type { RrrCondition } from './types';
import { repairRrrCondition } from './repairCondition';

describe('repairRrrCondition', () => {
  it('clears a single module condition that references a deleted module', () => {
    const condition: RrrCondition = {
      type: 'module',
      moduleId: 'module_1',
    };

    expect(repairRrrCondition(condition, [])).toBeUndefined();
  });

  it('removes deleted module references from sequence children', () => {
    const condition: RrrCondition = {
      type: 'sequence',
      children: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };

    expect(repairRrrCondition(condition, ['module_2'])).toEqual({
      type: 'sequence',
      children: [{ type: 'module', moduleId: 'module_2' }],
    });
  });

  it('removes deleted module references from future sequence steps', () => {
    const condition: RrrCondition = {
      type: 'sequence',
      steps: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };

    expect(repairRrrCondition(condition, ['module_2'])).toEqual({
      type: 'sequence',
      steps: [{ type: 'module', moduleId: 'module_2' }],
    });
  });

  it('removes deleted module references from all_of and any_of children', () => {
    const condition: RrrCondition = {
      type: 'all_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        {
          type: 'any_of',
          children: [
            { type: 'module', moduleId: 'module_2' },
            { type: 'module', moduleId: 'module_3' },
          ],
        },
      ],
    };

    expect(repairRrrCondition(condition, ['module_1', 'module_3'])).toEqual({
      type: 'all_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        {
          type: 'any_of',
          children: [{ type: 'module', moduleId: 'module_3' }],
        },
      ],
    });
  });

  it('returns undefined when a composite condition becomes empty', () => {
    const condition: RrrCondition = {
      type: 'any_of',
      children: [{ type: 'module', moduleId: 'module_1' }],
    };

    expect(repairRrrCondition(condition, [])).toBeUndefined();
  });

  it('clears malformed composite conditions instead of crashing', () => {
    expect(
      repairRrrCondition({ type: 'all_of' } as RrrCondition, ['module_1']),
    ).toBeUndefined();
  });

  it('keeps the repaired interaction schema-valid after deletion', () => {
    const condition: RrrCondition = {
      type: 'all_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'module_2' },
      ],
    };
    const repairedCondition = repairRrrCondition(condition, ['module_2']);

    expect(() =>
      RrrInteractionSchema.parse({
        schemaVersion: 1,
        modules: [
          {
            id: 'module_2',
            type: 'text_answer',
            label: 'Text answer',
            config: {},
          },
        ],
        condition: repairedCondition,
      }),
    ).not.toThrow();
  });
});
