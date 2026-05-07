import type { RrrCondition } from '../types';
import type { RrrConditionResult, RrrRuntimeStatus } from '../evaluator/types';
import type { RrrRuntimeSession } from '../session/session';

export function evaluateCondition(
  condition: RrrCondition | undefined,
  moduleStatusById: ReadonlyMap<string, RrrRuntimeStatus>,
  session?: RrrRuntimeSession,
): RrrConditionResult {
  if (!condition) {
    return {
      status: 'idle',
      message: 'Keine Lösungsregel festgelegt',
    };
  }

  if (condition.type === 'module') {
    if (session?.completedModuleIds.includes(condition.moduleId)) {
      return {
        status: 'success',
        message: `Baustein ${condition.moduleId} erfüllt`,
        condition,
      };
    }
    const status = moduleStatusById.get(condition.moduleId);
    if (!status) {
      return {
        status: 'failed',
        message: `Unbekannter Baustein ${condition.moduleId}`,
        condition,
      };
    }
    return {
      status,
      message: `Einzelner Baustein ${condition.moduleId}`,
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
      message: 'Keine Bausteine in der Lösungsregel',
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
      message: 'Keine Bausteine in der Lösungsregel',
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
      message: 'Ein Schritt ist fehlgeschlagen',
      condition,
      activeSequenceIndex: activeIndex,
    };
  }
  if (activeResult.status !== 'success') {
    return {
      status: 'running',
      message: 'Nacheinander-Regel läuft',
      condition,
      activeSequenceIndex: activeIndex,
    };
  }

  if (activeIndex < children.length - 1) {
    return {
      status: 'running',
      message: 'Nacheinander-Regel läuft',
      condition,
      activeSequenceIndex: activeIndex + 1,
    };
  }
  return {
    status: 'success',
    message: 'Nacheinander-Regel erfüllt',
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
      message: 'Eine Lösung ist erfüllt',
      condition,
    };
  }
  if (childResults.every((child) => child.status === 'failed')) {
    return {
      status: 'failed',
      message: 'Alle Möglichkeiten sind fehlgeschlagen',
      condition,
    };
  }
  return {
    status: 'running',
    message: 'Warte auf eine erfüllte Möglichkeit',
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
        'Mindestens ein nötiger Baustein ist fehlgeschlagen',
      condition,
    };
  }

  if (childResults.every((child) => child.status === 'success')) {
    return {
      status: 'success',
      message:
        'Alle nötigen Bausteine sind erfüllt',
      condition,
    };
  }

  return {
    status: 'running',
    message:
      'Warte auf alle nötigen Bausteine',
    condition,
  };
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  const children = 'steps' in condition ? condition.steps : condition.children;
  return Array.isArray(children) ? children : [];
}
