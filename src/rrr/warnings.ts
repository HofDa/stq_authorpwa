import type { RrrCondition, RrrInteraction, RrrModule } from './types';

export type RrrWarningCode =
  | 'no_modules'
  | 'no_condition'
  | 'missing_module_reference'
  | 'sequence_no_steps'
  | 'all_of_no_children'
  | 'any_of_no_children'
  | 'text_answer_empty'
  | 'compass_target_invalid'
  | 'compass_tolerance_narrow'
  | 'gps_missing_coordinates'
  | 'gps_radius_small'
  | 'hold_duration_long';

export type RrrWarningSeverity = 'info' | 'warning';

export interface RrrWarning {
  code: RrrWarningCode;
  message: string;
  severity: RrrWarningSeverity;
  moduleId?: string;
}

const MIN_COMPASS_TOLERANCE_DEGREES = 3;
const MIN_GPS_RADIUS_METERS = 3;
const MAX_HOLD_DURATION_MS = 10000;

export function getRrrWarnings(interaction: RrrInteraction): RrrWarning[] {
  const warnings: RrrWarning[] = [];

  if (interaction.modules.length === 0) {
    warnings.push({
      code: 'no_modules',
      message: 'No modules added.',
      severity: 'info',
    });
  }

  if (!interaction.condition) {
    warnings.push({
      code: 'no_condition',
      message: 'No condition selected.',
      severity: 'info',
    });
  }

  for (const module of interaction.modules) {
    warnings.push(...getModuleWarnings(module));
  }

  if (interaction.condition) {
    warnings.push(...getConditionWarnings(interaction.condition, interaction.modules));
  }

  return warnings;
}

function getModuleWarnings(module: RrrModule): RrrWarning[] {
  switch (module.type) {
    case 'text_answer': {
      if (readString(module.config.answer).trim() === '') {
        return [
          {
            code: 'text_answer_empty',
            message: `Text answer module "${module.label}" has no answer.`,
            severity: 'warning',
            moduleId: module.id,
          },
        ];
      }
      return [];
    }
    case 'compass_align': {
      const out: RrrWarning[] = [];
      const targetDegrees = module.config.targetDegrees;
      if (!isValidDegrees(targetDegrees)) {
        out.push({
          code: 'compass_target_invalid',
          message: `Compass module "${module.label}" is missing a valid target heading.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const tolerance = readNumber(module.config.tolerance);
      if (tolerance > 0 && tolerance < MIN_COMPASS_TOLERANCE_DEGREES) {
        out.push({
          code: 'compass_tolerance_narrow',
          message: `Compass module "${module.label}" tolerance is very narrow (< ${MIN_COMPASS_TOLERANCE_DEGREES}°).`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      return out;
    }
    case 'gps_enter': {
      const out: RrrWarning[] = [];
      if (!isValidCoordinate(module.config.lat) || !isValidCoordinate(module.config.lng)) {
        out.push({
          code: 'gps_missing_coordinates',
          message: `GPS module "${module.label}" is missing latitude or longitude.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const radiusMeters = readNumber(module.config.radiusMeters);
      if (radiusMeters > 0 && radiusMeters < MIN_GPS_RADIUS_METERS) {
        out.push({
          code: 'gps_radius_small',
          message: `GPS module "${module.label}" radius is very small (< ${MIN_GPS_RADIUS_METERS} m).`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      return out;
    }
    case 'hold_still': {
      const durationMs = readNumber(module.config.durationMs);
      if (durationMs > MAX_HOLD_DURATION_MS) {
        return [
          {
            code: 'hold_duration_long',
            message: `Hold-still module "${module.label}" duration is long (> ${MAX_HOLD_DURATION_MS} ms).`,
            severity: 'info',
            moduleId: module.id,
          },
        ];
      }
      return [];
    }
  }
}

function getConditionWarnings(
  condition: RrrCondition,
  modules: RrrModule[],
): RrrWarning[] {
  const out: RrrWarning[] = [];
  const moduleIds = new Set(modules.map((module) => module.id));

  function visit(node: RrrCondition) {
    if (node.type === 'module') {
      if (!moduleIds.has(node.moduleId)) {
        out.push({
          code: 'missing_module_reference',
          message: `Condition references missing module "${node.moduleId}".`,
          severity: 'warning',
          moduleId: node.moduleId,
        });
      }
      return;
    }

    const children = 'steps' in node ? node.steps : node.children;

    if (node.type === 'sequence' && children.length === 0) {
      out.push({
        code: 'sequence_no_steps',
        message: 'Sequence condition has no steps.',
        severity: 'info',
      });
    } else if (node.type === 'all_of' && children.length === 0) {
      out.push({
        code: 'all_of_no_children',
        message: '"All of" condition has no children.',
        severity: 'info',
      });
    } else if (node.type === 'any_of' && children.length === 0) {
      out.push({
        code: 'any_of_no_children',
        message: '"Any of" condition has no children.',
        severity: 'info',
      });
    }

    for (const child of children) {
      visit(child);
    }
  }

  visit(condition);
  return out;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isValidDegrees(value: unknown): boolean {
  return (
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 360
  );
}

function isValidCoordinate(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}
