import type { RrrCondition, RrrInteraction, RrrModule } from '../types';

export type RrrAuthoringWarningCode =
  | 'no_modules'
  | 'no_condition'
  | 'missing_module_reference'
  | 'missing_fallback_reference'
  | 'compass_tolerance_narrow'
  | 'direction_tolerance_narrow'
  | 'gps_radius_small'
  | 'proximity_radius_small'
  | 'hold_duration_long'
  | 'text_answer_empty'
  | 'multi_choice_question_empty'
  | 'multi_choice_options_empty'
  | 'multi_choice_correct_empty'
  | 'qr_scan_expected_value_empty'
  | 'code_word_empty'
  | 'sequential_code_empty'
  | 'timer_wait_duration_missing'
  | 'timer_wait_duration_long'
  | 'photo_check_manual_prompt_empty'
  | 'object_found_prompt_empty';

export interface RrrAuthoringWarning {
  code: RrrAuthoringWarningCode;
  message: string;
  path?: string;
}

const MIN_COMPASS_TOLERANCE_DEGREES = 5;
const MIN_GPS_RADIUS_METERS = 3;
const MAX_HOLD_DURATION_MS = 30000;
const MAX_TIMER_WAIT_DURATION_MS = 60000;

export function getRrrAuthoringWarnings(
  interaction: RrrInteraction,
): RrrAuthoringWarning[] {
  const warnings: RrrAuthoringWarning[] = [];

  if (interaction.modules.length === 0) {
    warnings.push({
      code: 'no_modules',
      message: 'No modules added.',
      path: 'modules',
    });
  }

  if (!interaction.condition) {
    warnings.push({
      code: 'no_condition',
      message: 'No condition selected.',
      path: 'condition',
    });
  }

  interaction.modules.forEach((module, index) => {
    warnings.push(...getModuleWarnings(module, index));
  });

  const moduleIds = new Set(interaction.modules.map((module) => module.id));
  interaction.modules.forEach((module, index) => {
    if (
      module.fallbackModuleId &&
      !moduleIds.has(module.fallbackModuleId)
    ) {
      warnings.push({
        code: 'missing_fallback_reference',
        message: `Module "${module.label}" references missing fallback module "${module.fallbackModuleId}".`,
        path: `modules.${index}.fallbackModuleId`,
      });
    }
  });

  if (interaction.condition) {
    visitConditionModuleReferences(interaction.condition, (moduleId, path) => {
      if (!moduleIds.has(moduleId)) {
        warnings.push({
          code: 'missing_module_reference',
          message: `Condition references missing module "${moduleId}".`,
          path,
        });
      }
    });
  }

  return warnings;
}

function getModuleWarnings(
  module: RrrModule,
  index: number,
): RrrAuthoringWarning[] {
  switch (module.type) {
    case 'text_answer': {
      if (readString(module.config.answer).trim() === '') {
        return [
          {
            code: 'text_answer_empty',
            message: `Text answer module "${module.label}" has no answer.`,
            path: `modules.${index}.config.answer`,
          },
        ];
      }
      return [];
    }
    case 'multi_choice': {
      const out: RrrAuthoringWarning[] = [];
      if (readString(module.config.question).trim() === '') {
        out.push({
          code: 'multi_choice_question_empty',
          message: `Multi-choice module "${module.label}" has no question.`,
          path: `modules.${index}.config.question`,
        });
      }
      if (readStringArray(module.config.options).every((option) => option.trim() === '')) {
        out.push({
          code: 'multi_choice_options_empty',
          message: `Multi-choice module "${module.label}" has no options.`,
          path: `modules.${index}.config.options`,
        });
      }
      if (readNumberArray(module.config.correctOptionIndexes).length === 0) {
        out.push({
          code: 'multi_choice_correct_empty',
          message: `Multi-choice module "${module.label}" has no correct option.`,
          path: `modules.${index}.config.correctOptionIndexes`,
        });
      }
      return out;
    }
    case 'compass_align': {
      const tolerance = readNumber(module.config.tolerance);
      if (tolerance > 0 && tolerance < MIN_COMPASS_TOLERANCE_DEGREES) {
        return [
          {
            code: 'compass_tolerance_narrow',
            message: `Compass module "${module.label}" has a very narrow tolerance.`,
            path: `modules.${index}.config.tolerance`,
          },
        ];
      }
      return [];
    }
    case 'direction_hotcold': {
      const tolerance = readNumber(module.config.successTolerance);
      if (tolerance > 0 && tolerance < MIN_COMPASS_TOLERANCE_DEGREES) {
        return [
          {
            code: 'direction_tolerance_narrow',
            message: `Direction hot/cold module "${module.label}" has a very narrow success tolerance.`,
            path: `modules.${index}.config.successTolerance`,
          },
        ];
      }
      return [];
    }
    case 'gps_enter': {
      const radiusMeters = readNumber(module.config.radiusMeters);
      if (radiusMeters > 0 && radiusMeters < MIN_GPS_RADIUS_METERS) {
        return [
          {
            code: 'gps_radius_small',
            message: `GPS module "${module.label}" has a very small radius.`,
            path: `modules.${index}.config.radiusMeters`,
          },
        ];
      }
      return [];
    }
    case 'proximity_hint': {
      const radiusMeters = readNumber(module.config.successRadiusMeters);
      if (radiusMeters > 0 && radiusMeters < MIN_GPS_RADIUS_METERS) {
        return [
          {
            code: 'proximity_radius_small',
            message: `Proximity hint module "${module.label}" has a very small success radius.`,
            path: `modules.${index}.config.successRadiusMeters`,
          },
        ];
      }
      return [];
    }
    case 'hold_still': {
      const durationMs = readNumber(module.config.durationMs);
      if (durationMs > MAX_HOLD_DURATION_MS) {
        return [
          {
            code: 'hold_duration_long',
            message: `Hold-still module "${module.label}" may take too long.`,
            path: `modules.${index}.config.durationMs`,
          },
        ];
      }
      return [];
    }
    case 'qr_scan': {
      if (readString(module.config.expectedValue).trim() === '') {
        return [
          {
            code: 'qr_scan_expected_value_empty',
            message: `QR scan module "${module.label}" has no expected value.`,
            path: `modules.${index}.config.expectedValue`,
          },
        ];
      }
      return [];
    }
    case 'code_word': {
      if (readString(module.config.code).trim() === '') {
        return [
          {
            code: 'code_word_empty',
            message: `Code word module "${module.label}" has no code.`,
            path: `modules.${index}.config.code`,
          },
        ];
      }
      return [];
    }
    case 'sequential_code': {
      if (readString(module.config.code).trim() === '') {
        return [
          {
            code: 'sequential_code_empty',
            message: `Sequential code module "${module.label}" has no code.`,
            path: `modules.${index}.config.code`,
          },
        ];
      }
      return [];
    }
    case 'timer_wait': {
      const durationMs = readNumber(module.config.durationMs);
      if (durationMs <= 0) {
        return [
          {
            code: 'timer_wait_duration_missing',
            message: `Timer module "${module.label}" has no duration.`,
            path: `modules.${index}.config.durationMs`,
          },
        ];
      }
      if (durationMs > MAX_TIMER_WAIT_DURATION_MS) {
        return [
          {
            code: 'timer_wait_duration_long',
            message: `Timer module "${module.label}" may take too long.`,
            path: `modules.${index}.config.durationMs`,
          },
        ];
      }
      return [];
    }
    case 'photo_check_manual': {
      if (readString(module.config.prompt).trim() === '') {
        return [
          {
            code: 'photo_check_manual_prompt_empty',
            message: `Manual photo-check module "${module.label}" has no prompt.`,
            path: `modules.${index}.config.prompt`,
          },
        ];
      }
      return [];
    }
    case 'object_found': {
      if (readString(module.config.prompt).trim() === '') {
        return [
          {
            code: 'object_found_prompt_empty',
            message: `Object-found module "${module.label}" has no prompt.`,
            path: `modules.${index}.config.prompt`,
          },
        ];
      }
      return [];
    }
  }
}

function visitConditionModuleReferences(
  condition: RrrCondition,
  visitor: (moduleId: string, path: string) => void,
  path = 'condition',
) {
  if (condition.type === 'module') {
    visitor(condition.moduleId, `${path}.moduleId`);
    return;
  }

  const children = getConditionChildren(condition);
  const key = 'steps' in condition ? 'steps' : 'children';
  children.forEach((child, index) => {
    visitConditionModuleReferences(child, visitor, `${path}.${key}.${index}`);
  });
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  const children = 'steps' in condition ? condition.steps : condition.children;
  return Array.isArray(children) ? children : [];
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => Number.isInteger(entry) && entry >= 0)
    : [];
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
