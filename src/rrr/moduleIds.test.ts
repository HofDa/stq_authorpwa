import { describe, expect, it } from 'vitest';
import type { RrrModule } from './types';
import {
  createUniqueModuleId,
  isUniqueModuleId,
  normalizeModuleId,
} from './moduleIds';

describe('RRR module id utilities', () => {
  it('normalizes labels into stable module ids', () => {
    expect(normalizeModuleId('Face North')).toBe('face_north');
    expect(normalizeModuleId('  Enter GPS radius!  ')).toBe(
      'enter_gps_radius',
    );
    expect(normalizeModuleId('Hold---Still')).toBe('hold_still');
    expect(normalizeModuleId('')).toBe('module');
  });

  it('creates unique ids for a module type', () => {
    const modules: RrrModule[] = [
      createModule('face_direction_1'),
      createModule('face_direction_2'),
    ];

    expect(createUniqueModuleId('compass_align', modules)).toBe(
      'face_direction_3',
    );
  });

  it('detects duplicate ids without requiring config changes', () => {
    const modules: RrrModule[] = [
      createModule('module_1', { answer: 'tower' }),
      createModule('module_2', { answer: 'gate' }),
    ];
    const updatedConfigModules = [
      { ...modules[0], config: { answer: 'castle' } },
      modules[1],
    ];
    const duplicatedModules = [...modules, createModule('module_1')];

    expect(isUniqueModuleId('module_1', updatedConfigModules)).toBe(true);
    expect(isUniqueModuleId('module_1', duplicatedModules)).toBe(false);
  });
});

function createModule(
  id: string,
  config: Record<string, unknown> = {},
): RrrModule {
  return {
    id,
    type: 'text_answer',
    label: id,
    config,
  };
}
