import type { RrrCondition, RrrModule } from '../types';
import type { RrrRuntimeSession } from '../session/session';

export type RrrRuntimeStatus = 'idle' | 'running' | 'success' | 'failed';

export type DirectionHotColdProximity =
  | 'very_cold'
  | 'cold'
  | 'warm'
  | 'very_warm'
  | 'correct';

export type ProximityHintState =
  | 'far'
  | 'getting_closer'
  | 'near'
  | 'very_near'
  | 'inside_target_radius';

export interface RrrRuntimeMockState {
  headingDegrees?: number;
  gpsLat?: number;
  gpsLng?: number;
  isStill?: boolean;
}

export interface RrrRuntimeUserInput {
  textAnswer?: string;
  qrScanValue?: string;
  morseCodeValue?: string;
  codeWordValue?: string;
  sequentialCodeValue?: string;
  multiChoiceSelectionsByModuleId?: Record<string, number[]>;
  photoCheckManualModuleIds?: string[];
  objectFoundModuleIds?: string[];
}

export interface RrrModuleResult {
  id: string;
  label: string;
  type: RrrModule['type'];
  status: RrrRuntimeStatus;
  message: string;
  directionHotCold?: {
    proximity: DirectionHotColdProximity;
    headingDegrees: number;
    targetDegrees: number;
    deltaDegrees: number;
    successTolerance: number;
  };
  proximityHint?: {
    proximity: ProximityHintState;
    distanceMeters: number;
    targetLat: number;
    targetLng: number;
    currentLat: number;
    currentLng: number;
    successRadiusMeters: number;
  };
  timeout?: {
    timedOut: boolean;
    retryable: boolean;
    attempts: number;
    maxAttempts?: number;
    elapsedMs?: number;
    timeoutMs: number;
  };
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
  activeModuleId?: string;
  nowMs?: number;
}
