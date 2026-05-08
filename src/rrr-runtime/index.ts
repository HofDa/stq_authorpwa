export { evaluateCondition } from '@/rrr-core/conditions/evaluateCondition';
export {
  evaluateModule,
  getDirectionHotColdFeedback,
  getProximityHintFeedback,
} from '@/rrr-core/modules/evaluateModule';
export { createRrrRuntimeBridge } from './createRrrRuntimeBridge';
export { useRrrRuntimeBridge } from './useRrrRuntimeBridge';
export {
  createRrrRuntimeSession,
  evaluateInteraction,
  reduceRrrRuntimeSession,
  resetRrrRuntimeSession,
  type RrrInteraction,
  type DirectionHotColdProximity,
  type ProximityHintState,
  type RrrConditionResult,
  type RrrInteractionResult,
  type RrrModuleResult,
  type RrrRuntimeEvaluationInput,
  type RrrRuntimeMockState,
  type RrrRuntimeSession,
  type RrrRuntimeSessionAction,
  type RrrRuntimeStatus,
  type RrrRuntimeUserInput,
} from '@/rrr-core';
export type {
  RrrRuntimeBridge,
  RrrRuntimeBridgeListener,
  RrrRuntimeBridgeOptions,
  RrrRuntimeBridgeSnapshot,
  RrrRuntimeBridgeSmoothingOptions,
  RrrRuntimeBridgeStillnessOptions,
  RrrRuntimeBridgeStillnessState,
} from './types';
