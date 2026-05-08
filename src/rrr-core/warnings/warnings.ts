import type { RrrCondition, RrrInteraction, RrrModule } from '../types';

export type RrrWarningCode =
  | 'no_modules'
  | 'no_condition'
  | 'missing_module_reference'
  | 'missing_fallback_reference'
  | 'sequence_no_steps'
  | 'all_of_no_children'
  | 'any_of_no_children'
  | 'text_answer_empty'
  | 'multi_choice_question_empty'
  | 'multi_choice_options_empty'
  | 'multi_choice_correct_empty'
  | 'compass_target_invalid'
  | 'compass_tolerance_narrow'
  | 'direction_target_invalid'
  | 'direction_tolerance_narrow'
  | 'gps_missing_coordinates'
  | 'gps_radius_small'
  | 'proximity_missing_coordinates'
  | 'proximity_radius_small'
  | 'hold_duration_long'
  | 'qr_scan_expected_value_empty'
  | 'code_word_empty'
  | 'sequential_code_empty'
  | 'timer_wait_duration_missing'
  | 'timer_wait_duration_long'
  | 'photo_check_manual_prompt_empty'
  | 'object_found_prompt_empty';

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
const MAX_TIMER_WAIT_DURATION_MS = 60000;

export function getRrrWarnings(interaction: RrrInteraction): RrrWarning[] {
  const warnings: RrrWarning[] = [];

  if (interaction.modules.length === 0) {
    warnings.push({
      code: 'no_modules',
      message: 'Noch keine Bausteine hinzugefügt.',
      severity: 'info',
    });
  }

  if (!interaction.condition) {
    warnings.push({
      code: 'no_condition',
      message: 'Noch keine Lösungsregel gewählt.',
      severity: 'info',
    });
  }

  for (const module of interaction.modules) {
    warnings.push(...getModuleWarnings(module));
  }
  warnings.push(...getFallbackWarnings(interaction.modules));

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
            message: `Baustein "${module.label}" hat noch keine Antwort.`,
            severity: 'warning',
            moduleId: module.id,
          },
        ];
      }
      return [];
    }
    case 'multi_choice': {
      const out: RrrWarning[] = [];
      if (readString(module.config.question).trim() === '') {
        out.push({
          code: 'multi_choice_question_empty',
          message: `Baustein "${module.label}" hat noch keine Frage.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      if (readStringArray(module.config.options).every((option) => option.trim() === '')) {
        out.push({
          code: 'multi_choice_options_empty',
          message: `Baustein "${module.label}" hat noch keine Antwortoptionen.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      if (readNumberArray(module.config.correctOptionIndexes).length === 0) {
        out.push({
          code: 'multi_choice_correct_empty',
          message: `Baustein "${module.label}" hat noch keine richtige Option.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      return out;
    }
    case 'compass_align': {
      const out: RrrWarning[] = [];
      const targetDegrees = module.config.targetDegrees;
      if (!isValidDegrees(targetDegrees)) {
        out.push({
          code: 'compass_target_invalid',
          message: `Baustein "${module.label}" braucht eine gültige Zielrichtung.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const tolerance = readNumber(module.config.tolerance);
      if (tolerance > 0 && tolerance < MIN_COMPASS_TOLERANCE_DEGREES) {
        out.push({
          code: 'compass_tolerance_narrow',
          message: `Baustein "${module.label}" hat eine sehr enge Toleranz (< ${MIN_COMPASS_TOLERANCE_DEGREES}°).`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      return out;
    }
    case 'direction_hotcold': {
      const out: RrrWarning[] = [];
      const targetDegrees = module.config.targetDegrees;
      if (!isValidDegrees(targetDegrees)) {
        out.push({
          code: 'direction_target_invalid',
          message: `Baustein "${module.label}" braucht eine gültige Zielrichtung.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const tolerance = readNumber(module.config.successTolerance);
      if (tolerance > 0 && tolerance < MIN_COMPASS_TOLERANCE_DEGREES) {
        out.push({
          code: 'direction_tolerance_narrow',
          message: `Baustein "${module.label}" hat eine sehr enge Erfolgstoleranz (< ${MIN_COMPASS_TOLERANCE_DEGREES}°).`,
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
          message: `Baustein "${module.label}" braucht Breiten- und Längengrad.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const radiusMeters = readNumber(module.config.radiusMeters);
      if (radiusMeters > 0 && radiusMeters < MIN_GPS_RADIUS_METERS) {
        out.push({
          code: 'gps_radius_small',
          message: `Baustein "${module.label}" hat einen sehr kleinen Radius (< ${MIN_GPS_RADIUS_METERS} m).`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      return out;
    }
    case 'proximity_hint': {
      const out: RrrWarning[] = [];
      if (!isValidCoordinate(module.config.lat) || !isValidCoordinate(module.config.lng)) {
        out.push({
          code: 'proximity_missing_coordinates',
          message: `Baustein "${module.label}" braucht Breiten- und Längengrad.`,
          severity: 'warning',
          moduleId: module.id,
        });
      }
      const radiusMeters = readNumber(module.config.successRadiusMeters);
      if (radiusMeters > 0 && radiusMeters < MIN_GPS_RADIUS_METERS) {
        out.push({
          code: 'proximity_radius_small',
          message: `Baustein "${module.label}" hat einen sehr kleinen Erfolgsradius (< ${MIN_GPS_RADIUS_METERS} m).`,
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
            message: `Baustein "${module.label}" dauert lange (> ${MAX_HOLD_DURATION_MS} ms).`,
            severity: 'info',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" hat noch keinen erwarteten QR-Wert.`,
            severity: 'warning',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" hat noch kein Codewort.`,
            severity: 'warning',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" hat noch keinen gesammelten Code.`,
            severity: 'warning',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" braucht eine Wartezeit.`,
            severity: 'warning',
            moduleId: module.id,
          },
        ];
      }
      if (durationMs > MAX_TIMER_WAIT_DURATION_MS) {
        return [
          {
            code: 'timer_wait_duration_long',
            message: `Baustein "${module.label}" hat eine lange Wartezeit (> ${MAX_TIMER_WAIT_DURATION_MS} ms).`,
            severity: 'info',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" hat noch keine Foto-Aufgabe.`,
            severity: 'warning',
            moduleId: module.id,
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
            message: `Baustein "${module.label}" hat noch keine Fund-Anweisung.`,
            severity: 'warning',
            moduleId: module.id,
          },
        ];
      }
      return [];
    }
  }
}

function getFallbackWarnings(modules: RrrModule[]): RrrWarning[] {
  const moduleIds = new Set(modules.map((module) => module.id));
  return modules.flatMap((module) => {
    if (
      !module.fallbackModuleId ||
      moduleIds.has(module.fallbackModuleId)
    ) {
      return [];
    }
    return [
      {
        code: 'missing_fallback_reference' as const,
        message: `Fallback von "${module.label}" verweist auf den fehlenden Baustein "${module.fallbackModuleId}".`,
        severity: 'warning' as const,
        moduleId: module.id,
      },
    ];
  });
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
          message: `Die Lösungsregel verweist auf den fehlenden Baustein "${node.moduleId}".`,
          severity: 'warning',
          moduleId: node.moduleId,
        });
      }
      return;
    }

    const children = getConditionChildren(node);

    if (node.type === 'sequence' && children.length === 0) {
      out.push({
        code: 'sequence_no_steps',
        message: 'Die Nacheinander-Regel hat noch keine Schritte.',
        severity: 'info',
      });
    } else if (node.type === 'all_of' && children.length === 0) {
      out.push({
        code: 'all_of_no_children',
        message: 'Die Regel "Alles muss erfüllt sein" hat noch keine Bausteine.',
        severity: 'info',
      });
    } else if (node.type === 'any_of' && children.length === 0) {
      out.push({
        code: 'any_of_no_children',
        message: 'Die Regel "Eine Lösung reicht" hat noch keine Bausteine.',
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
