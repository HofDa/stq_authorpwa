import type { RrrCondition } from '../types';

export type RrrFlatConditionType = 'none' | RrrCondition['type'];

export function buildFlatCondition(
  conditionType: RrrFlatConditionType,
  moduleIds: string[],
): RrrCondition | undefined {
  const cleanIds = moduleIds.filter(Boolean);
  if (conditionType === 'none' || cleanIds.length === 0) {
    return undefined;
  }
  if (conditionType === 'module') {
    return {
      type: 'module',
      moduleId: cleanIds[0],
    };
  }
  if (conditionType === 'sequence') {
    return {
      type: 'sequence',
      children: cleanIds.map((moduleId) => ({
        type: 'module',
        moduleId,
      })),
    };
  }
  return {
    type: conditionType,
    children: cleanIds.map((moduleId) => ({
      type: 'module',
      moduleId,
    })),
  };
}

export function conditionToFlatModuleIds(
  condition: RrrCondition | undefined,
): string[] {
  if (!condition) {
    return [];
  }
  if (condition.type === 'module') {
    return [condition.moduleId];
  }
  return getConditionChildren(condition).flatMap((child) =>
    child.type === 'module' ? [child.moduleId] : conditionToFlatModuleIds(child),
  );
}

export function isFlatCondition(condition: RrrCondition): boolean {
  if (condition.type === 'module') {
    return true;
  }
  return getConditionChildren(condition).every((child) => child.type === 'module');
}

export function getConditionChildren(condition: RrrCondition): RrrCondition[] {
  if (condition.type === 'module') {
    return [];
  }

  const children = 'steps' in condition ? condition.steps : condition.children;
  return Array.isArray(children) ? children : [];
}
