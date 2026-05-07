import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { evaluateInteraction } from './evaluateInteraction';

describe('evaluateInteraction', () => {
  it('returns status, module record, and condition result', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Text answer',
          config: { answer: 'tower', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    };

    const result = evaluateInteraction(
      interaction,
      {},
      { textAnswer: 'Tower' },
    );

    expect(result).toEqual({
      status: 'success',
      modules: {
        module_1: {
          id: 'module_1',
          label: 'Text answer',
          type: 'text_answer',
          status: 'success',
          message: 'Antwort passt',
        },
      },
      condition: {
        status: 'success',
        message: 'Einzelner Baustein module_1',
        condition: { type: 'module', moduleId: 'module_1' },
      },
    });
  });
});
