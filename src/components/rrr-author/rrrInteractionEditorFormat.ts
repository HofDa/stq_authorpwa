import type { EditorTextKey } from '@/i18n/editorLanguage';

export type EditorT = (key: EditorTextKey) => string;

export function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeMultiChoiceOptions(value: unknown): string[] {
  const options = Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
  return options.length > 0 ? options : [''];
}

export function normalizeMultiChoiceIndexes(
  value: unknown,
  options: readonly string[],
): number[] {
  const maxIndex = options.length - 1;
  const indexes = Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === 'number') return entry;
          if (typeof entry === 'string') return Number(entry);
          return Number.NaN;
        })
        .filter(
          (entry) =>
            Number.isInteger(entry) &&
            entry >= 0 &&
            entry <= maxIndex,
        )
    : [];
  return [...new Set(indexes)];
}

export function hasFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatNumber(
  value: number,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(value);
}

export function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function normalizeDurationMs(value: number): number {
  return Math.max(0, Math.round(value));
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatDurationSeconds(durationMs: number): string {
  if (durationMs < 1000) {
    return `${formatNumber(durationMs, 0)} ms`;
  }

  return `${formatNumber(durationMs / 1000, 1)} s`;
}

export function formatEditorText(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}
