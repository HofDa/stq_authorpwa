import type { RrrInteraction } from '../types';
import { evaluateCondition } from '../conditions/evaluateCondition';
import { evaluateModule } from '../modules/evaluateModule';
import type {
  RrrInteractionResult,
  RrrRuntimeMockState,
  RrrRuntimeUserInput,
} from './types';
import type { RrrRuntimeSession } from '../session/session';

export function evaluateInteraction(
  interaction: RrrInteraction,
  mockState: RrrRuntimeMockState,
  userInput: RrrRuntimeUserInput = {},
  session?: RrrRuntimeSession,
): RrrInteractionResult {
  const input = { mockState, userInput, session };
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
