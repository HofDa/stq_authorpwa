import type { RrrModule } from './types';

export function readRrrNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function readRrrString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function readRrrStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
}

export function readRrrNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === 'number') return entry;
          if (typeof entry === 'string') return Number(entry);
          return Number.NaN;
        })
        .filter((entry) => Number.isInteger(entry) && entry >= 0)
    : [];
}

export function readRrrTextAnswers(
  module: RrrModule,
  fallback: readonly string[] = [],
): string[] {
  const answers = [
    readRrrString(module.config.answer),
    ...readRrrStringArray(module.config.acceptedAnswers),
  ].filter((entry) => entry.trim().length > 0);

  return answers.length > 0 ? answers : [...fallback];
}
