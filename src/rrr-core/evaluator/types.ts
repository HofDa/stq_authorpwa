import type { RrrCondition, RrrModule } from '../types';
import type { RrrRuntimeSession } from '../session/session';

export type RrrRuntimeStatus = 'idle' | 'running' | 'success' | 'failed';

export interface RrrRuntimeMockState {
  headingDegrees?: number;
  gpsLat?: number;
  gpsLng?: number;
  isStill?: boolean;
}

export interface RrrRuntimeUserInput {
  textAnswer?: string;
}

export interface RrrModuleResult {
  id: string;
  label: string;
  type: RrrModule['type'];
  status: RrrRuntimeStatus;
  message: string;
}

export interface RrrConditionResult {
  status: RrrRuntimeStatus;
  message: string;
  condition?: RrrCondition;
  activeSequenceIndex?: number;
}

export interface RrrInteractionResult {
  status: RrrRuntimeStatus;
  modules: Record<string, RrrModuleResult>;
  condition: RrrConditionResult;
}

export interface RrrRuntimeEvaluationInput {
  mockState: RrrRuntimeMockState;
  userInput: RrrRuntimeUserInput;
  session?: RrrRuntimeSession;
}
