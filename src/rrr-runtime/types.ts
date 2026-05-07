export type {
  RrrInteraction,
  RrrConditionResult,
  RrrInteractionResult,
  RrrModuleResult,
  RrrRuntimeEvaluationInput,
  RrrRuntimeMockState,
  RrrRuntimeSession,
  RrrRuntimeStatus,
  RrrRuntimeUserInput,
} from '@/rrr-core';
import type {
  RrrInteraction,
  RrrInteractionResult,
  RrrRuntimeMockState,
  RrrRuntimeSession,
  RrrRuntimeUserInput,
} from '@/rrr-core';
import type { RrrSensorAdapter, RrrSensorState } from '@/rrr-sensors';

export interface RrrRuntimeBridgeStillnessOptions {
  thresholdMs?: number;
  releaseMs?: number;
  headingMovementThresholdDegrees?: number;
  tiltMovementThresholdDegrees?: number;
}

export interface RrrRuntimeBridgeSmoothingOptions {
  enabled?: boolean;
  headingAlpha?: number;
  tiltAlpha?: number;
  gpsAlpha?: number;
  maxGpsAccuracyMeters?: number;
}

export interface RrrRuntimeBridgeOptions {
  interaction: RrrInteraction;
  adapters: RrrSensorAdapter[];
  userInput?: RrrRuntimeUserInput;
  evaluationIntervalMs?: number;
  stillness?: RrrRuntimeBridgeStillnessOptions;
  smoothing?: RrrRuntimeBridgeSmoothingOptions;
  now?: () => number;
}

export interface RrrRuntimeBridgeStillnessState {
  isStill: boolean;
  lastMovementAt?: number;
  source: 'adapter' | 'derived' | 'unavailable';
}

export interface RrrRuntimeBridgeSnapshot {
  interaction: RrrInteraction;
  rawSensorState: RrrSensorState;
  sensorState: RrrSensorState;
  smoothing: {
    enabled: boolean;
    gpsAccepted: boolean;
    gpsIgnoredReason?: 'missing_coordinates' | 'poor_accuracy';
    recommendedGpsRadiusMeters?: number;
  };
  mockState: RrrRuntimeMockState;
  userInput: RrrRuntimeUserInput;
  result: RrrInteractionResult;
  session: RrrRuntimeSession;
  stillness: RrrRuntimeBridgeStillnessState;
  started: boolean;
}

export type RrrRuntimeBridgeListener = (
  snapshot: RrrRuntimeBridgeSnapshot,
) => void;

export interface RrrRuntimeBridge {
  getSnapshot(): RrrRuntimeBridgeSnapshot;
  subscribe(listener: RrrRuntimeBridgeListener): () => void;
  start(): Promise<void>;
  stop(): void;
  reset(): void;
  retry(moduleId?: string, options?: { resetProgress?: boolean }): void;
  setUserInput(userInput: RrrRuntimeUserInput): void;
  dispose(): void;
}
