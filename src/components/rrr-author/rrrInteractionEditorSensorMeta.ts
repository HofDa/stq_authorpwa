import type { EditorTextKey } from '@/i18n/editorLanguage';
import type { EditorT } from './rrrInteractionEditorFormat';
import { formatEditorText } from './rrrInteractionEditorFormat';

export const COMPASS_DIRECTION_PRESETS = [
  { labelKey: 'rrr.editor.compass.north', degrees: 0 },
  { labelKey: 'rrr.editor.compass.east', degrees: 90 },
  { labelKey: 'rrr.editor.compass.south', degrees: 180 },
  { labelKey: 'rrr.editor.compass.west', degrees: 270 },
] as const;

export const HOLD_STILL_DURATION_PRESETS = [
  { label: '1 s', durationMs: 1000 },
  { label: '2 s', durationMs: 2000 },
  { label: '3 s', durationMs: 3000 },
  { label: '5 s', durationMs: 5000 },
] as const;

export const TIMER_WAIT_DURATION_PRESETS = [
  { label: '3 s', durationMs: 3000 },
  { label: '5 s', durationMs: 5000 },
  { label: '10 s', durationMs: 10000 },
  { label: '30 s', durationMs: 30000 },
] as const;

export function getGpsRadiusMeta(radiusMeters: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'precise' | 'normal' | 'forgiving';
} {
  if (radiusMeters < 5) {
    return {
      label: t('rrr.editor.gps.radiusPrecise'),
      description: t('rrr.editor.gps.radiusPreciseHint'),
      tone: 'precise',
    };
  }

  if (radiusMeters <= 20) {
    return {
      label: t('rrr.editor.gps.radiusNormal'),
      description: t('rrr.editor.gps.radiusNormalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.gps.radiusForgiving'),
    description: t('rrr.editor.gps.radiusForgivingHint'),
    tone: 'forgiving',
  };
}

export function getHoldStillDurationMeta(durationMs: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs < 2000) {
    return {
      label: t('rrr.editor.duration.short'),
      description: t('rrr.editor.duration.shortHint'),
      tone: 'short',
    };
  }

  if (durationMs <= 3000) {
    return {
      label: t('rrr.editor.duration.normal'),
      description: t('rrr.editor.duration.normalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.duration.long'),
    description: t('rrr.editor.duration.longHint'),
    tone: 'long',
  };
}

export function getTimerWaitDurationMeta(durationMs: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs <= 5000) {
    return {
      label: t('rrr.editor.wait.short'),
      description: t('rrr.editor.wait.shortHint'),
      tone: 'short',
    };
  }

  if (durationMs <= 30000) {
    return {
      label: t('rrr.editor.wait.normal'),
      description: t('rrr.editor.wait.normalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.wait.long'),
    description: t('rrr.editor.wait.longHint'),
    tone: 'long',
  };
}

export function normalizeCompassDegrees(value: number): number {
  const normalized = value % 360;
  return Math.round(normalized < 0 ? normalized + 360 : normalized);
}

export function getCompassDirectionLabel(degrees: number, t: EditorT): string {
  const nearestPreset = COMPASS_DIRECTION_PRESETS.reduce(
    (best, preset) =>
      getDegreeDistance(degrees, preset.degrees) <
      getDegreeDistance(degrees, best.degrees)
        ? preset
        : best,
    COMPASS_DIRECTION_PRESETS[0],
  );

  return formatEditorText(t('rrr.editor.compass.near'), {
    direction: t(nearestPreset.labelKey),
  });
}

export function getCompassCardinalInitial(
  key: EditorTextKey,
  t: EditorT,
): string {
  return t(key).trim().slice(0, 1).toUpperCase();
}

export function getDegreeDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeCompassDegrees(left - right));
  return Math.min(difference, 360 - difference);
}
