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
  balanceOk: boolean;
  textAnswer: string;
  qrScanValue: string;
  morseCodeValue: string;
  codeWordValue: string;
  sequentialCodeValue: string;
  multiChoiceSelectionsByModuleId: Record<string, number[]>;
  photoCheckManualModuleIds: string[];
  objectFoundModuleIds: string[];
}

export type RrrMockModuleResult = RrrModuleResult;

export type RrrMockConditionResult = RrrConditionResult;

export type RrrMockEvaluation = RrrInteractionResult;
