import type { RrrCondition } from '../types';

export function repairRrrCondition(
  condition: RrrCondition | undefined,
  validModuleIds: Iterable<string>,
): RrrCondition | undefined {
  if (!condition) {
    return undefined;
  }

  const validIds = new Set(validModuleIds);
  return repairConditionNode(condition, validIds);
}

function repairConditionNode(
  condition: RrrCondition,
  validModuleIds: ReadonlySet<string>,
): RrrCondition | undefined {
  if (condition.type === 'module') {
    return validModuleIds.has(condition.moduleId) ? condition : undefined;
  }

  const children = getConditionChildren(condition).flatMap((child) => {
    const repairedChild = repairConditionNode(child, validModuleIds);
    return repairedChild ? [repairedChild] : [];
  });

  if (children.length === 0) {
    return undefined;
  }

  return {
    ...condition,
    ...getConditionChildrenPatch(condition, children),
  };
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  const children = 'steps' in condition ? condition.steps : condition.children;
  return Array.isArray(children) ? children : [];
}

function getConditionChildrenPatch(
  condition: Exclude<RrrCondition, { type: 'module' }>,
  children: RrrCondition[],
): { steps: RrrCondition[] } | { children: RrrCondition[] } {
  return 'steps' in condition ? { steps: children } : { children };
}
