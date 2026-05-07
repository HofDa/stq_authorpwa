export const RRR_INTERACTION_VERSION = 1;

export const RRR_MODULE_TYPES = [
  'text_answer',
  'compass_align',
  'hold_still',
  'gps_enter',
] as const;

export type RrrModuleType = (typeof RRR_MODULE_TYPES)[number];

export const RRR_CONDITION_TYPES = [
  'module',
  'sequence',
  'all_of',
  'any_of',
] as const;

export type RrrConditionType = (typeof RRR_CONDITION_TYPES)[number];

export const RRR_COMPOSITE_CONDITION_TYPES = [
  'sequence',
  'all_of',
  'any_of',
] as const;

export const RRR_GROUP_CONDITION_TYPES = ['all_of', 'any_of'] as const;

export interface RrrModule {
  id: string;
  type: RrrModuleType;
  label: string;
  config: Record<string, unknown>;
}

export type RrrCondition =
  | {
      type: 'module';
      moduleId: string;
    }
  | {
      type: 'sequence';
      steps: RrrCondition[];
    }
  | {
      type: 'sequence';
      children: RrrCondition[];
    }
  | {
      type: (typeof RRR_GROUP_CONDITION_TYPES)[number];
      children: RrrCondition[];
    };

export interface RrrInteraction {
  schemaVersion: 1;
  modules: RrrModule[];
  condition?: RrrCondition;
}
