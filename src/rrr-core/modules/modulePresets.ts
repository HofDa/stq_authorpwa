import type { RrrModule, RrrModuleType } from '../types';
import { createUniqueModuleId } from './moduleIds';

export interface RrrModulePreset {
  type: RrrModuleType;
  label: string;
  createConfig: () => Record<string, unknown>;
}

export const RRR_MODULE_PRESETS: Record<RrrModuleType, RrrModulePreset> = {
  text_answer: {
    type: 'text_answer',
    label: 'Textantwort',
    createConfig: () => ({ answer: '', caseSensitive: false }),
  },
  compass_align: {
    type: 'compass_align',
    label: 'Richtung finden',
    createConfig: () => ({ targetDegrees: 0, tolerance: 15 }),
  },
  hold_still: {
    type: 'hold_still',
    label: 'Stillhalten',
    createConfig: () => ({ durationMs: 3000 }),
  },
  gps_enter: {
    type: 'gps_enter',
    label: 'Ort erreichen',
    createConfig: () => ({ lat: 0, lng: 0, radiusMeters: 20 }),
  },
};

export function createRrrModuleFromPreset(
  moduleType: RrrModuleType,
  existingModules: readonly RrrModule[],
): RrrModule {
  const preset = RRR_MODULE_PRESETS[moduleType];
  return {
    id: createUniqueModuleId(preset.type, existingModules),
    type: preset.type,
    label: preset.label,
    config: preset.createConfig(),
  };
}
