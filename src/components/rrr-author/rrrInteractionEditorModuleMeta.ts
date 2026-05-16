import {
  RRR_MODULE_PRESETS,
  normalizeMorseSymbolPattern,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import type { IconName } from '@/components/studio/Icon';
import {
  formatDurationSeconds,
  formatEditorText,
  formatNumber,
  hasFiniteNumber,
  normalizeMultiChoiceIndexes,
  normalizeMultiChoiceOptions,
  readNumber,
  readString,
  type EditorT,
} from './rrrInteractionEditorFormat';

export function getModuleDifficultyLabel(
  difficulty: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['difficulty'],
  t: EditorT,
): string {
  switch (difficulty) {
    case 'easy':
      return t('rrr.editor.difficulty.easy');
    case 'medium':
      return t('rrr.editor.difficulty.medium');
    case 'advanced':
      return t('rrr.editor.difficulty.advanced');
  }
}

export function getModuleReliabilityLabel(
  reliability: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['reliability'],
  t: EditorT,
): string {
  switch (reliability) {
    case 'high':
      return t('rrr.editor.reliability.high');
    case 'medium':
      return t('rrr.editor.reliability.medium');
    case 'device-dependent':
      return t('rrr.editor.reliability.deviceDependent');
  }
}

export function getModuleCardMeta(module: RrrModule, t: EditorT): {
  title: string;
  description: string;
  icon: IconName;
} {
  switch (module.type) {
    case 'text_answer':
      return {
        title: t('rrr.editor.card.textAnswerTitle'),
        description: t('rrr.editor.card.textAnswerDescription'),
        icon: 'type',
      };
    case 'multi_choice':
      return {
        title: t('rrr.editor.card.multiChoiceTitle'),
        description: t('rrr.editor.card.multiChoiceDescription'),
        icon: 'check',
      };
    case 'gps_enter':
      return {
        title: t('rrr.editor.card.gpsTitle'),
        description: t('rrr.editor.card.gpsDescription'),
        icon: 'map-pin',
      };
    case 'proximity_hint':
      return {
        title: t('rrr.editor.card.proximityTitle'),
        description: t('rrr.editor.card.proximityDescription'),
        icon: 'map-pin',
      };
    case 'balance_run':
      return {
        title: t('rrr.editor.card.balanceTitle'),
        description: t('rrr.editor.card.balanceDescription'),
        icon: 'route',
      };
    case 'compass_align':
      return {
        title: t('rrr.editor.card.compassTitle'),
        description: t('rrr.editor.card.compassDescription'),
        icon: 'compass',
      };
    case 'safe_dial':
      return {
        title: t('rrr.editor.card.safeDialTitle'),
        description: t('rrr.editor.card.safeDialDescription'),
        icon: 'compass',
      };
    case 'direction_hotcold':
      return {
        title: t('rrr.editor.card.directionHotcoldTitle'),
        description: t('rrr.editor.card.directionHotcoldDescription'),
        icon: 'compass',
      };
    case 'hold_still':
      return {
        title: t('rrr.editor.card.holdStillTitle'),
        description: t('rrr.editor.card.holdStillDescription'),
        icon: 'hand',
      };
    case 'qr_scan':
      return {
        title: t('rrr.editor.card.qrTitle'),
        description: t('rrr.editor.card.qrDescription'),
        icon: 'qr-code',
      };
    case 'morse_code':
      return {
        title: t('rrr.editor.card.morseTitle'),
        description: t('rrr.editor.card.morseDescription'),
        icon: 'mic',
      };
    case 'code_word':
      return {
        title: t('rrr.editor.card.codeWordTitle'),
        description: t('rrr.editor.card.codeWordDescription'),
        icon: 'type',
      };
    case 'sequential_code':
      return {
        title: t('rrr.editor.card.sequentialTitle'),
        description: t('rrr.editor.card.sequentialDescription'),
        icon: 'type',
      };
    case 'timer_wait':
      return {
        title: t('rrr.editor.card.timerTitle'),
        description: t('rrr.editor.card.timerDescription'),
        icon: 'clock',
      };
    case 'photo_check_manual':
      return {
        title: t('rrr.editor.card.photoTitle'),
        description: t('rrr.editor.card.photoDescription'),
        icon: 'image',
      };
    case 'object_found':
      return {
        title: t('rrr.editor.card.objectTitle'),
        description: t('rrr.editor.card.objectDescription'),
        icon: 'check-circle',
      };
  }
}

export function getModuleSettingsSummary(
  module: RrrModule,
  t: EditorT,
): Array<{ label: string; value: string }> {
  const config = module.config;
  const notSet = t('rrr.editor.summary.notSet');
  switch (module.type) {
    case 'text_answer': {
      const answer = readString(config.answer).trim();
      return [
        {
          label: t('rrr.editor.summary.answer'),
          value: answer ? `"${answer}"` : notSet,
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'multi_choice': {
      const question = readString(config.question).trim();
      const options = normalizeMultiChoiceOptions(config.options);
      const filledOptions = options.filter((option) => option.trim() !== '');
      const correctCount = normalizeMultiChoiceIndexes(
        config.correctOptionIndexes,
        options,
      ).length;
      return [
        {
          label: t('rrr.editor.summary.question'),
          value: question || notSet,
        },
        {
          label: t('rrr.editor.summary.options'),
          value:
            filledOptions.length > 0
              ? formatEditorText(t('rrr.editor.multiChoice.optionsSummary'), {
                  options: String(filledOptions.length),
                  correct: String(correctCount),
                })
              : notSet,
        },
      ];
    }
    case 'gps_enter':
      return [
        {
          label: t('rrr.editor.summary.target'),
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : t('rrr.editor.summary.coordinatesMissing'),
        },
        {
          label: t('rrr.editor.summary.radius'),
          value: `${formatNumber(readNumber(config.radiusMeters), 0)} m`,
        },
      ];
    case 'proximity_hint':
      return [
        {
          label: t('rrr.editor.summary.target'),
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : t('rrr.editor.summary.coordinatesMissing'),
        },
        {
          label: t('rrr.editor.summary.successRadius'),
          value: `${formatNumber(readNumber(config.successRadiusMeters), 0)} m`,
        },
      ];
    case 'balance_run':
      return [
        {
          label: t('rrr.editor.summary.target'),
          value:
            hasFiniteNumber(config.targetLat) && hasFiniteNumber(config.targetLng)
              ? `${formatNumber(readNumber(config.targetLat), 5)}, ${formatNumber(
                  readNumber(config.targetLng),
                  5,
                )}`
              : t('rrr.editor.summary.coordinatesMissing'),
        },
        {
          label: t('rrr.editor.summary.duration'),
          value: formatDurationSeconds(readNumber(config.timeLimitMs) || 60000),
        },
        {
          label: t('rrr.editor.summary.tolerance'),
          value: `±${formatNumber(readNumber(config.maxTiltDegrees) || 12, 0)}°`,
        },
      ];
    case 'compass_align':
      return [
        {
          label: t('rrr.editor.summary.direction'),
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.tolerance'),
          value: `±${formatNumber(readNumber(config.tolerance), 0)}°`,
        },
      ];
    case 'safe_dial':
      return [
        {
          label: t('rrr.editor.summary.direction'),
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.tolerance'),
          value: `±${formatNumber(readNumber(config.tolerance), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.hold'),
          value: formatDurationSeconds(readNumber(config.holdMs) || 900),
        },
      ];
    case 'direction_hotcold':
      return [
        {
          label: t('rrr.editor.summary.direction'),
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.successTolerance'),
          value: `±${formatNumber(readNumber(config.successTolerance), 0)}°`,
        },
      ];
    case 'hold_still': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: t('rrr.editor.summary.duration'),
          value:
            durationMs >= 1000
              ? `${formatNumber(durationMs / 1000, 1)} s`
              : `${formatNumber(durationMs, 0)} ms`,
        },
      ];
    }
    case 'qr_scan': {
      const expectedValue = readString(config.expectedValue).trim();
      return [
        {
          label: t('rrr.editor.summary.qrValue'),
          value: expectedValue ? `"${expectedValue}"` : notSet,
        },
      ];
    }
    case 'morse_code': {
      const pattern = normalizeMorseSymbolPattern(readString(config.pattern));
      const hasShortAudio = readString(config.shortAudioUrl).trim() !== '';
      const hasLongAudio = readString(config.longAudioUrl).trim() !== '';
      return [
        {
          label: t('rrr.editor.summary.morsePattern'),
          value: pattern ? `"${pattern}"` : notSet,
        },
        {
          label: t('rrr.editor.summary.morseAudio'),
          value:
            hasShortAudio && hasLongAudio
              ? t('rrr.editor.morse.audioReady')
              : t('rrr.editor.morse.syntheticAudio'),
        },
      ];
    }
    case 'code_word': {
      const code = readString(config.code).trim();
      return [
        {
          label: t('rrr.editor.summary.codeWord'),
          value: code ? `"${code}"` : notSet,
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'sequential_code': {
      const code = readString(config.code).trim();
      const hint = readString(config.hint).trim();
      return [
        {
          label: t('rrr.editor.summary.code'),
          value: code ? `"${code}"` : notSet,
        },
        {
          label: t('rrr.editor.summary.hint'),
          value: hint || t('rrr.editor.sequential.noHint'),
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'timer_wait': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: t('rrr.editor.summary.wait'),
          value: formatDurationSeconds(durationMs),
        },
      ];
    }
    case 'photo_check_manual': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: t('rrr.editor.summary.instruction'),
          value: prompt || notSet,
        },
        {
          label: t('rrr.editor.summary.button'),
          value:
            confirmLabel || t('rrr.editor.manual.confirmPlaceholderConfirmed'),
        },
      ];
    }
    case 'object_found': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: t('rrr.editor.summary.instruction'),
          value: prompt || notSet,
        },
        {
          label: t('rrr.editor.summary.button'),
          value: confirmLabel || t('rrr.editor.manual.confirmPlaceholderFound'),
        },
      ];
    }
  }
}

export function getFallbackSettingsSummary(
  module: RrrModule,
  modules: RrrModule[],
  expertMode: boolean,
  t: EditorT,
): Array<{ label: string; value: string }> {
  if (!module.fallbackModuleId) {
    return [];
  }

  return [
    {
      label: t('rrr.editor.fallback.label'),
      value: getModuleDisplayLabel(module.fallbackModuleId, modules, expertMode, t),
    },
  ];
}

export function getModuleDisplayLabel(
  moduleId: string,
  modules: RrrModule[],
  expertMode: boolean,
  t: EditorT,
): string {
  const module = modules.find((entry) => entry.id === moduleId);
  if (module) {
    return module.label;
  }
  return expertMode
    ? `${t('rrr.editor.fallback.missing')} (${moduleId})`
    : t('rrr.editor.fallback.missing');
}

export function formatModuleOption(
  module: RrrModule,
  expertMode: boolean,
): string {
  return expertMode ? `${module.label} (${module.id})` : module.label;
}
