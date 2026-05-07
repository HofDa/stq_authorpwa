import type {
  RrrConditionResult,
  RrrInteractionResult,
  RrrModuleResult,
  RrrRuntimeStatus,
} from '@/rrr-runtime';

export type RrrMockStatus = RrrRuntimeStatus;

export interface RrrMockInputs {
  headingDegrees: number;
  gpsLat: number;
  gpsLng: number;
  isStill: boolean;
  textAnswer: string;
}

export type RrrMockModuleResult = RrrModuleResult;

export type RrrMockConditionResult = RrrConditionResult;

export type RrrMockEvaluation = RrrInteractionResult;
