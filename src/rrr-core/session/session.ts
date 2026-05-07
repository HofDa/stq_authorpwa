import type { RrrRuntimeStatus } from '../evaluator/types';

export interface RrrRuntimeSession {
  completedModuleIds: string[];
  activeSequenceIndex: number;
  status: RrrRuntimeStatus;
}

export function createRrrRuntimeSession(): RrrRuntimeSession {
  return {
    completedModuleIds: [],
    activeSequenceIndex: 0,
    status: 'idle',
  };
}

export function resetRrrRuntimeSession(): RrrRuntimeSession {
  return createRrrRuntimeSession();
}
