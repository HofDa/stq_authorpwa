import type { RrrModule, RrrModuleType } from '../types';

const MODULE_ID_BASES: Record<RrrModuleType, string> = {
  text_answer: 'module',
  compass_align: 'face_direction',
  hold_still: 'hold_still',
  gps_enter: 'gps_enter',
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
