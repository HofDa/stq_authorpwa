import { describe, expect, it } from 'vitest';
import { RrrModuleSchema } from '@/schema';
import { createRrrModuleFromPreset } from './modulePresets';
import { RRR_MODULE_TYPES } from './types';

describe('RRR module presets', () => {
  it('creates a valid module for each supported module type', () => {
    for (const type of RRR_MODULE_TYPES) {
      const module = createRrrModuleFromPreset(type, []);

      expect(() => RrrModuleSchema.parse(module)).not.toThrow();
      expect(module.type).toBe(type);
      expect(module.label).not.toBe('');
    }
  });

  it('creates stable unique ids from the preset base', () => {
    const firstModule = createRrrModuleFromPreset('hold_still', []);
    const secondModule = createRrrModuleFromPreset('hold_still', [firstModule]);

    expect(firstModule.id).toBe('hold_still_1');
    expect(secondModule.id).toBe('hold_still_2');
  });

  it('creates fresh default config objects', () => {
    const firstModule = createRrrModuleFromPreset('text_answer', []);
    const secondModule = createRrrModuleFromPreset('text_answer', [
      firstModule,
    ]);

    expect(firstModule.config).toEqual({
      answer: '',
      caseSensitive: false,
    });
    expect(secondModule.config).toEqual(firstModule.config);
    expect(secondModule.config).not.toBe(firstModule.config);
  });
});
