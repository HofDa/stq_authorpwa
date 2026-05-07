import type { RrrCondition } from '@/rrr';
import type { RrrConditionResult, RrrRuntimeStatus } from './types';
import type { RrrRuntimeSession } from './session';

export function evaluateCondition(
  condition: RrrCondition | undefined,
  moduleStatusById: ReadonlyMap<string, RrrRuntimeStatus>,
  session?: RrrRuntimeSession,
): RrrConditionResult {
  if (!condition) {
    return {
      status: 'idle',
      message: 'No condition configured',
    };
  }

  if (condition.type === 'module') {
    if (session?.completedModuleIds.includes(condition.moduleId)) {
      return {
        status: 'success',
        message: `Completed module ${condition.moduleId}`,
        condition,
      };
    }
    const status = moduleStatusById.get(condition.moduleId);
    if (!status) {
      return {
        status: 'failed',
        message: `Unknown module ${condition.moduleId}`,
        condition,
      };
    }
    return {
      status,
      message: `Single module ${condition.moduleId}`,
      condition,
    };
  }

  if (condition.type === 'sequence') {
    return evaluateSequence(condition, moduleStatusById, session);
  }

  const childResults = getConditionChildren(condition).map((child) =>
    evaluateCondition(child, moduleStatusById, session),
  );

  if (childResults.length === 0) {
    return {
      status: 'idle',
      message: 'No condition items configured',
      condition,
    };
  }

  if (condition.type === 'any_of') {
    return evaluateAnyOf(condition, childResults);
  }

  return evaluateRequiredChildren(condition, childResults);
}

function evaluateSequence(
  condition: Extract<RrrCondition, { type: 'sequence' }>,
  moduleStatusById: ReadonlyMap<string, RrrRuntimeStatus>,
  session: RrrRuntimeSession | undefined,
): RrrConditionResult {
  const children = getConditionChildren(condition);
  if (children.length === 0) {
    return {
      status: 'idle',
      message: 'No condition items configured',
      condition,
      activeSequenceIndex: 0,
    };
  }

  let activeIndex = Math.min(
    Math.max(session?.activeSequenceIndex ?? 0, 0),
    children.length - 1,
  );

  for (let index = 0; index < activeIndex; index += 1) {
    const previous = evaluateCondition(children[index], moduleStatusById, session);
    if (previous.status !== 'success') {
      activeIndex = index;
      break;
    }
  }

  const activeResult = evaluateCondition(
    children[activeIndex],
    moduleStatusById,
    session,
  );
  if (activeResult.status === 'failed') {
    return {
      status: 'failed',
      message: 'A sequence step failed',
      condition,
      activeSequenceIndex: activeIndex,
    };
  }
  if (activeResult.status !== 'success') {
    return {
      status: 'running',
      message: 'Sequence in progress',
      condition,
      activeSequenceIndex: activeIndex,
    };
  }

  if (activeIndex < children.length - 1) {
    return {
      status: 'running',
      message: 'Sequence in progress',
      condition,
      activeSequenceIndex: activeIndex + 1,
    };
  }
  return {
    status: 'success',
    message: 'Sequence complete',
    condition,
    activeSequenceIndex: children.length,
  };
}

function evaluateAnyOf(
  condition: Exclude<RrrCondition, { type: 'module' }>,
  childResults: RrrConditionResult[],
): RrrConditionResult {
  if (childResults.some((child) => child.status === 'success')) {
    return {
      status: 'success',
      message: 'At least one condition succeeded',
      condition,
    };
  }
  if (childResults.every((child) => child.status === 'failed')) {
    return {
      status: 'failed',
      message: 'All alternatives failed',
      condition,
    };
  }
  return {
    status: 'running',
    message: 'Waiting for one condition to succeed',
    condition,
  };
}

function evaluateRequiredChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
  childResults: RrrConditionResult[],
): RrrConditionResult {
  if (childResults.some((child) => child.status === 'failed')) {
    return {
      status: 'failed',
      message:
        'At least one required condition failed',
      condition,
    };
  }

  if (childResults.every((child) => child.status === 'success')) {
    return {
      status: 'success',
      message:
        'All required conditions succeeded',
      condition,
    };
  }

  return {
    status: 'running',
    message:
      'Waiting for all required conditions',
    condition,
  };
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  return 'steps' in condition ? condition.steps : condition.children;
}
