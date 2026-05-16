import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  RrrConditionSchema,
  RrrConditionTypeSchema,
  RrrModuleSchema,
  RrrModuleTypeSchema,
} from '@/schema';
import {
  RRR_CONDITION_TYPES,
  RRR_MODULE_TYPES,
  type RrrCondition,
  type RrrConditionType,
  type RrrModuleType,
} from '@/rrr-core';

const CORE_EVALUATED_MODULE_TYPES = [
  'text_answer',
  'multi_choice',
  'compass_align',
  'safe_dial',
  'direction_hotcold',
  'hold_still',
  'gps_enter',
  'proximity_hint',
  'qr_scan',
  'morse_code',
  'code_word',
  'sequential_code',
  'timer_wait',
  'photo_check_manual',
  'object_found',
] as const satisfies readonly RrrModuleType[];

const CORE_EVALUATED_CONDITION_TYPES = [
  'module',
  'sequence',
  'all_of',
  'any_of',
] as const satisfies readonly RrrConditionType[];

function sortValues<T extends string>(values: readonly T[]): T[] {
  return [...values].sort();
}

function createCondition(type: RrrConditionType): RrrCondition {
  const child: RrrCondition = { type: 'module', moduleId: 'module-1' };

  if (type === 'module') {
    return child;
  }
  if (type === 'sequence') {
    return { type, steps: [child] };
  }
  return { type, children: [child] };
}

describe('RRR schema/core consistency', () => {
  it('keeps module type schemas aligned with core support', () => {
    expect(sortValues(RrrModuleTypeSchema.options)).toEqual(
      sortValues(RRR_MODULE_TYPES),
    );
    expect(sortValues(CORE_EVALUATED_MODULE_TYPES)).toEqual(
      sortValues(RRR_MODULE_TYPES),
    );

    for (const type of CORE_EVALUATED_MODULE_TYPES) {
      expect(
        RrrModuleSchema.safeParse({
          id: `module-${type}`,
          type,
          label: type,
          config: {},
        }).success,
      ).toBe(true);
    }
  });

  it('keeps condition type schemas aligned with core support', () => {
    expect(sortValues(RrrConditionTypeSchema.options)).toEqual(
      sortValues(RRR_CONDITION_TYPES),
    );
    expect(sortValues(CORE_EVALUATED_CONDITION_TYPES)).toEqual(
      sortValues(RRR_CONDITION_TYPES),
    );

    for (const type of CORE_EVALUATED_CONDITION_TYPES) {
      expect(RrrConditionSchema.safeParse(createCondition(type)).success).toBe(
        true,
      );
    }
  });

  it('keeps module evaluator switch cases aligned with supported module types', async () => {
    const source = await readFile(
      path.resolve(process.cwd(), 'src/rrr-core/modules/evaluateModule.ts'),
      'utf8',
    );
    const switchCases = Array.from(source.matchAll(/case '([^']+)'/g), (match) =>
      match[1],
    );

    expect(sortValues(switchCases)).toEqual(
      sortValues(CORE_EVALUATED_MODULE_TYPES),
    );
  });
});
