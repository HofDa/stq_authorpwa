import type { RrrCondition } from '@/rrr';
import type { RrrInteractionResult } from './types';
import {
  createRrrRuntimeSession,
  type RrrRuntimeSession,
} from './session';

export type RrrRuntimeSessionAction =
  | {
      type: 'evaluation';
      result: RrrInteractionResult;
    }
  | {
      type: 'reset';
    };

export function reduceRrrRuntimeSession(
  session: RrrRuntimeSession,
  action: RrrRuntimeSessionAction,
): RrrRuntimeSession {
  switch (action.type) {
    case 'reset':
      return createRrrRuntimeSession();
    case 'evaluation':
      return {
        completedModuleIds: getCompletedModuleIds(session, action.result),
        activeSequenceIndex: action.result.condition.activeSequenceIndex ?? 0,
        status: action.result.status,
      };
  }
}

function getCompletedModuleIds(
  session: RrrRuntimeSession,
  result: RrrInteractionResult,
): string[] {
  const completed = new Set(session.completedModuleIds);
  if (result.condition.condition) {
    collectSuccessfulConditionModuleIds(
      result.condition.condition,
      result.modules,
      completed,
    );
  }
  return [...completed];
}

function collectSuccessfulConditionModuleIds(
  condition: RrrCondition,
  modules: RrrInteractionResult['modules'],
  completed: Set<string>,
) {
  if (condition.type === 'module') {
    const module = modules[condition.moduleId];
    if (module?.status === 'success') {
      completed.add(condition.moduleId);
    }
    return;
  }

  for (const child of getConditionChildren(condition)) {
    collectSuccessfulConditionModuleIds(child, modules, completed);
  }
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  return 'steps' in condition ? condition.steps : condition.children;
}
