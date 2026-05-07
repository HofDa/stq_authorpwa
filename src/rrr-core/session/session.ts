import type { RrrRuntimeStatus } from '../evaluator/types';

export interface RrrRuntimeSession {
  completedModuleIds: string[];
  activeSequenceIndex: number;
  status: RrrRuntimeStatus;
  activeStepStartedAtMs?: number;
  attemptsByModuleId: Record<string, number>;
  timedOutModuleIds: string[];
}

export function createRrrRuntimeSession(): RrrRuntimeSession {
  return {
    completedModuleIds: [],
    activeSequenceIndex: 0,
    status: 'idle',
    attemptsByModuleId: {},
    timedOutModuleIds: [],
  };
}

export function resetRrrRuntimeSession(): RrrRuntimeSession {
  return createRrrRuntimeSession();
}
