// Interaction schema model.
export {
  RRR_COMPOSITE_CONDITION_TYPES,
  RRR_CONDITION_TYPES,
  RRR_GROUP_CONDITION_TYPES,
  RRR_INTERACTION_VERSION,
  RRR_MODULE_TYPES,
  type RrrCondition,
  type RrrConditionType,
  type RrrInteraction,
  type RrrModule,
  type RrrModuleType,
} from './types';

// Runtime evaluation entrypoints and result/input types.
export { evaluateInteraction } from './evaluator/evaluateInteraction';
export {
  getDirectionHotColdFeedback,
  getProximityHintFeedback,
} from './modules/evaluateModule';
export {
  type DirectionHotColdProximity,
  type ProximityHintState,
  type RrrConditionResult,
  type RrrInteractionResult,
  type RrrModuleResult,
  type RrrRuntimeEvaluationInput,
  type RrrRuntimeMockState,
  type RrrRuntimeStatus,
  type RrrRuntimeUserInput,
} from './evaluator/types';

// Session state helpers.
export {
  createRrrRuntimeSession,
  resetRrrRuntimeSession,
  type RrrRuntimeSession,
} from './session/session';
export {
  reduceRrrRuntimeSession,
  type RrrRuntimeSessionAction,
} from './session/reducer';

// Authoring-safe condition and module helpers.
export { repairRrrCondition } from './conditions/repairCondition';
export {
  buildFlatCondition,
  conditionToFlatModuleIds,
  getConditionChildren,
  isFlatCondition,
  type RrrFlatConditionType,
} from './conditions/conditionHelpers';
export {
  createRrrModuleFromPreset,
  RRR_MODULE_CATEGORIES,
  RRR_MODULE_PRESET_GROUPS,
  RRR_MODULE_PRESETS,
  type RrrModuleCategory,
  type RrrModuleDifficulty,
  type RrrModulePreset,
  type RrrModuleReliability,
} from './modules/modulePresets';
export {
  createUniqueModuleId,
  isUniqueModuleId,
  normalizeModuleId,
} from './modules/moduleIds';

// Warnings and templates used by authoring/debug tooling.
export {
  getRrrAuthoringWarnings,
  type RrrAuthoringWarning,
  type RrrAuthoringWarningCode,
} from './warnings/authoringWarnings';
export {
  getRrrWarnings,
  type RrrWarning,
  type RrrWarningCode,
  type RrrWarningSeverity,
} from './warnings/warnings';
export {
  getRrrInteractionTemplate,
  RRR_INTERACTION_TEMPLATES,
  type RrrInteractionTemplate,
  type RrrInteractionTemplateId,
} from './templates/interactionTemplates';
