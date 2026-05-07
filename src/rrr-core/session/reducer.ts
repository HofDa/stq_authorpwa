import type { RrrCondition } from '../types';
import type { RrrInteractionResult } from '../evaluator/types';
import {
  createRrrRuntimeSession,
  type RrrRuntimeSession,
} from './session';

export type RrrRuntimeSessionAction =
  | {
      type: 'evaluation';
      result: RrrInteractionResult;
      nowMs?: number;
    }
  | {
      type: 'reset';
    }
  | {
      type: 'retry';
      moduleId?: string;
      nowMs?: number;
      resetProgress?: boolean;
    };

export function reduceRrrRuntimeSession(
  session: RrrRuntimeSession,
  action: RrrRuntimeSessionAction,
): RrrRuntimeSession {
  switch (action.type) {
    case 'reset':
      return createRrrRuntimeSession();
    case 'retry':
      return retrySession(session, action);
    case 'evaluation':
      return reduceEvaluation(session, action.result, action.nowMs ?? Date.now());
  }
}

function reduceEvaluation(
  session: RrrRuntimeSession,
  result: RrrInteractionResult,
  nowMs: number,
): RrrRuntimeSession {
  const activeSequenceIndex = result.condition.activeSequenceIndex ?? 0;
  const attemptsByModuleId = { ...(session.attemptsByModuleId ?? {}) };
  const timedOutModuleIds = new Set(session.timedOutModuleIds ?? []);

  for (const module of Object.values(result.modules)) {
    if (!module.timeout?.timedOut || timedOutModuleIds.has(module.id)) {
      continue;
    }
    attemptsByModuleId[module.id] = module.timeout.attempts;
    timedOutModuleIds.add(module.id);
  }

  return {
    completedModuleIds: getCompletedModuleIds(session, result),
    activeSequenceIndex,
    status: result.status,
    activeStepStartedAtMs:
      session.activeStepStartedAtMs === undefined ||
      activeSequenceIndex !== session.activeSequenceIndex
        ? nowMs
        : session.activeStepStartedAtMs,
    attemptsByModuleId,
    timedOutModuleIds: [...timedOutModuleIds],
  };
}

function retrySession(
  session: RrrRuntimeSession,
  action: Extract<RrrRuntimeSessionAction, { type: 'retry' }>,
): RrrRuntimeSession {
  const moduleId = action.moduleId;
  const resetProgress = action.resetProgress ?? false;
  return {
    ...session,
    completedModuleIds: resetProgress ? [] : session.completedModuleIds,
    activeSequenceIndex: resetProgress ? 0 : session.activeSequenceIndex,
    status: 'running',
    activeStepStartedAtMs: action.nowMs ?? Date.now(),
    timedOutModuleIds: moduleId
      ? (session.timedOutModuleIds ?? []).filter((id) => id !== moduleId)
      : [],
    attemptsByModuleId: { ...(session.attemptsByModuleId ?? {}) },
  };
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
  const children = 'steps' in condition ? condition.steps : condition.children;
  return Array.isArray(children) ? children : [];
}
