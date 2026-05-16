import type { RrrModule, RrrModuleType } from '../types';
import { createUniqueModuleId } from './moduleIds';

export const RRR_MODULE_CATEGORIES = [
  'Einfache Aufgaben',
  'Ort & Bewegung',
  'Ausrichtung & Sensoren',
  'Scannen & Medien',
  'Ersatzlösungen',
] as const;

export type RrrModuleCategory = (typeof RRR_MODULE_CATEGORIES)[number];

export type RrrModuleDifficulty = 'easy' | 'medium' | 'advanced';
export type RrrModuleReliability = 'high' | 'medium' | 'device-dependent';

export interface RrrModulePreset {
  type: RrrModuleType;
  label: string;
  category: RrrModuleCategory;
  difficulty: RrrModuleDifficulty;
  reliability: RrrModuleReliability;
  needsFallback: boolean;
  recommendedFallbackTypes: readonly RrrModuleType[];
  createConfig: () => Record<string, unknown>;
}

export const RRR_MODULE_PRESETS: Record<RrrModuleType, RrrModulePreset> = {
  text_answer: {
    type: 'text_answer',
    label: 'Textantwort',
    category: 'Einfache Aufgaben',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({ answer: '', caseSensitive: false }),
  },
  multi_choice: {
    type: 'multi_choice',
    label: 'Auswahlfrage',
    category: 'Einfache Aufgaben',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({
      question: '',
      options: ['', ''],
      correctOptionIndexes: [],
      allowMultiple: false,
    }),
  },
  compass_align: {
    type: 'compass_align',
    label: 'Richtung finden',
    category: 'Ausrichtung & Sensoren',
    difficulty: 'advanced',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word'],
    createConfig: () => ({ targetDegrees: 0, tolerance: 15 }),
  },
  safe_dial: {
    type: 'safe_dial',
    label: 'Tresor-Drehrad',
    category: 'Ausrichtung & Sensoren',
    difficulty: 'advanced',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word'],
    createConfig: () => ({ targetDegrees: 0, tolerance: 12, holdMs: 900 }),
  },
  direction_hotcold: {
    type: 'direction_hotcold',
    label: 'Richtung warm/kalt',
    category: 'Ausrichtung & Sensoren',
    difficulty: 'advanced',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word'],
    createConfig: () => ({ targetDegrees: 0, successTolerance: 15 }),
  },
  hold_still: {
    type: 'hold_still',
    label: 'Stillhalten',
    category: 'Ausrichtung & Sensoren',
    difficulty: 'medium',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word'],
    createConfig: () => ({ durationMs: 3000 }),
  },
  gps_enter: {
    type: 'gps_enter',
    label: 'Ort erreichen',
    category: 'Ort & Bewegung',
    difficulty: 'advanced',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word', 'object_found'],
    createConfig: () => ({ lat: 0, lng: 0, radiusMeters: 20 }),
  },
  proximity_hint: {
    type: 'proximity_hint',
    label: 'Nähe warm/kalt',
    category: 'Ort & Bewegung',
    difficulty: 'advanced',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word', 'object_found'],
    createConfig: () => ({ lat: 0, lng: 0, successRadiusMeters: 20 }),
  },
  qr_scan: {
    type: 'qr_scan',
    label: 'QR-Code scannen',
    category: 'Scannen & Medien',
    difficulty: 'medium',
    reliability: 'device-dependent',
    needsFallback: true,
    recommendedFallbackTypes: ['code_word'],
    createConfig: () => ({ expectedValue: '' }),
  },
  morse_code: {
    type: 'morse_code',
    label: 'Morsecode hören',
    category: 'Scannen & Medien',
    difficulty: 'medium',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({
      pattern: '',
      shortAudioUrl: '',
      longAudioUrl: '',
    }),
  },
  code_word: {
    type: 'code_word',
    label: 'Codewort eingeben',
    category: 'Ersatzlösungen',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({ code: '', caseSensitive: false }),
  },
  sequential_code: {
    type: 'sequential_code',
    label: 'Gesammelten Code eingeben',
    category: 'Einfache Aufgaben',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({ code: '', hint: '', caseSensitive: false }),
  },
  timer_wait: {
    type: 'timer_wait',
    label: 'Warten',
    category: 'Einfache Aufgaben',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({ durationMs: 3000 }),
  },
  photo_check_manual: {
    type: 'photo_check_manual',
    label: 'Foto-Aufgabe bestätigen',
    category: 'Scannen & Medien',
    difficulty: 'medium',
    reliability: 'high',
    needsFallback: true,
    recommendedFallbackTypes: ['object_found'],
    createConfig: () => ({ prompt: '', confirmLabel: 'Bestätigt' }),
  },
  object_found: {
    type: 'object_found',
    label: 'Objekt gefunden',
    category: 'Ersatzlösungen',
    difficulty: 'easy',
    reliability: 'high',
    needsFallback: false,
    recommendedFallbackTypes: [],
    createConfig: () => ({ prompt: '', confirmLabel: 'Gefunden' }),
  },
};

export const RRR_MODULE_PRESET_GROUPS = RRR_MODULE_CATEGORIES.map((label) => ({
  label,
  types: Object.values(RRR_MODULE_PRESETS)
    .filter((preset) => preset.category === label)
    .map((preset) => preset.type),
}));

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
