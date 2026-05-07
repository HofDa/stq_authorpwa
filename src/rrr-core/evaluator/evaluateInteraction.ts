import type { RrrInteraction } from '../types';
import { evaluateCondition } from '../conditions/evaluateCondition';
import { evaluateModule } from '../modules/evaluateModule';
import type {
  RrrInteractionResult,
  RrrRuntimeMockState,
  RrrRuntimeUserInput,
} from './types';
import type { RrrRuntimeSession } from '../session/session';
import type { RrrCondition } from '../types';

export function evaluateInteraction(
  interaction: RrrInteraction,
  mockState: RrrRuntimeMockState,
  userInput: RrrRuntimeUserInput = {},
  session?: RrrRuntimeSession,
  options: { nowMs?: number } = {},
): RrrInteractionResult {
  const activeModuleId = getActiveModuleId(interaction.condition, session);
  const input = {
    mockState,
    userInput,
    session,
    activeModuleId,
    nowMs: options.nowMs,
  };
  const moduleResults = interaction.modules.map((module) =>
    evaluateModule(module, input),
  );
  const modules = Object.fromEntries(
    moduleResults.map((module) => [module.id, module]),
  );
  const moduleStatusById = new Map(
    moduleResults.map((module) => [module.id, module.status]),
  );
  const condition = evaluateCondition(
    interaction.condition,
    moduleStatusById,
    session,
  );

  return {
    status: condition.status,
    modules,
    condition,
  };
}

function getActiveModuleId(
  condition: RrrCondition | undefined,
  session: RrrRuntimeSession | undefined,
): string | undefined {
  if (!condition) {
    return undefined;
  }
  if (condition.type === 'module') {
    return condition.moduleId;
  }
  if (condition.type !== 'sequence') {
    return undefined;
  }

  const children = 'steps' in condition ? condition.steps : condition.children;
  const activeIndex = Math.min(
    Math.max(session?.activeSequenceIndex ?? 0, 0),
    Math.max(children.length - 1, 0),
  );
  const activeCondition = children[activeIndex];
  return activeCondition?.type === 'module' ? activeCondition.moduleId : undefined;
}
