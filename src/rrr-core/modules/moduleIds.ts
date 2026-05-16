import type { RrrModule, RrrModuleType } from '../types';

const MODULE_ID_BASES: Record<RrrModuleType, string> = {
  text_answer: 'module',
  multi_choice: 'multi_choice',
  compass_align: 'face_direction',
  safe_dial: 'safe_dial',
  direction_hotcold: 'direction_hotcold',
  hold_still: 'hold_still',
  gps_enter: 'gps_enter',
  proximity_hint: 'proximity_hint',
  balance_run: 'balance_run',
  qr_scan: 'qr_scan',
  morse_code: 'morse_code',
  code_word: 'code_word',
  sequential_code: 'sequential_code',
  timer_wait: 'timer_wait',
  photo_check_manual: 'photo_check_manual',
  object_found: 'object_found',
};

export function createUniqueModuleId(
  type: RrrModuleType,
  existingModules: readonly RrrModule[],
): string {
  const base = normalizeModuleId(MODULE_ID_BASES[type]);
  const existingIds = new Set(existingModules.map((module) => module.id));
  let index = 1;
  let candidate = `${base}_${index}`;
  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `${base}_${index}`;
  }
  return candidate;
}

export function normalizeModuleId(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  return normalized === '' ? 'module' : normalized;
}

export function isUniqueModuleId(
  id: string,
  modules: readonly RrrModule[],
): boolean {
  return modules.filter((module) => module.id === id).length <= 1;
}
