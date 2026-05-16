import { describe, expect, it } from 'vitest';
import type { RrrModule } from './types';
import {
  readRrrNumber,
  readRrrNumberArray,
  readRrrString,
  readRrrStringArray,
  readRrrTextAnswers,
} from './moduleConfig';

describe('RRR module config readers', () => {
  it('coerces primitive config values consistently', () => {
    expect(readRrrNumber(12)).toBe(12);
    expect(readRrrNumber('12.5')).toBe(12.5);
    expect(readRrrNumber('not-a-number')).toBe(0);
    expect(readRrrString('value')).toBe('value');
    expect(readRrrString(12)).toBe('');
    expect(readRrrStringArray(['one', 2, 'three'])).toEqual(['one', '', 'three']);
    expect(readRrrNumberArray([0, '1', 2.5, -1, 'bad'])).toEqual([0, 1]);
  });

  it('uses configured text answers before legacy fallbacks', () => {
    const module = createModule({
      answer: 'Main',
      acceptedAnswers: ['Alt'],
    });

    expect(readRrrTextAnswers(module, ['Legacy'])).toEqual(['Main', 'Alt']);
  });

  it('falls back to legacy accepted answers when no module answers are configured', () => {
    expect(readRrrTextAnswers(createModule({}), ['Legacy'])).toEqual(['Legacy']);
  });
});

function createModule(config: Record<string, unknown>): RrrModule {
  return {
    id: 'text_answer_1',
    type: 'text_answer',
    label: 'Text answer',
    config,
  };
}
