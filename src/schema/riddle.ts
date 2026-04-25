import { z } from 'zod';
import { ContentBlockSchema } from './contentBlock';
import { LOCALES, type Locale } from './locales';
import { STATION_COLOR_KEYS, STATION_ICON_KEYS } from '@/stations/visuals';

/**
 * Authoring model for a text riddle / station.
 *
 * The PWA keeps `acceptedAnswers` as the single source of truth and
 * serializes only the primary answer per locale into Flutter's current
 * `locale.solution` export contract.
 */
const RiddleLocaleFields = {
  location: z.string(),
  firstSection: z.array(ContentBlockSchema),
  historySection: z.array(ContentBlockSchema),
  riddleSection: z.array(ContentBlockSchema),
  successSection: z.array(ContentBlockSchema),
  hints: z.array(z.string()).max(3),
};

export const RiddleLocaleSchema = z.object(RiddleLocaleFields);

export const ExportRiddleLocaleSchema = z.object({
  ...RiddleLocaleFields,
  solution: z.string().trim().min(1),
});

export const RiddleTypeSchema = z.enum(['text']);

const AcceptedAnswerListSchema = z
  .array(z.string())
  .default([])
  .transform(normalizeAcceptedAnswersList);

export const AcceptedAnswersSchema = z.object({
  en: AcceptedAnswerListSchema,
  de: AcceptedAnswerListSchema,
  it: AcceptedAnswerListSchema,
});

const AuthoringRiddleEntrySchema = z.object({
  id: z.string(),
  number: z.number().int().nonnegative(),
  position_lat: z.number(),
  position_lng: z.number(),
  polylineString: z.string(),
  imagePath: z.string(),
  /**
   * Authoring-only pointer at a Dexie-stored station photo blob. Stripped
   * on export (see `TourEntrySchema.coverBlobId`).
   */
  imageBlobId: z.string().optional(),
  iconPath: z.string(),
  markerIconPath: z.string(),
  /**
   * Authoring-only station visual selection. On export we rasterize the
   * chosen visual into icon/marker PNGs and keep only the generated paths.
   */
  iconKey: z.enum(STATION_ICON_KEYS).optional(),
  iconColorKey: z.enum(STATION_COLOR_KEYS).optional(),
  riddleType: RiddleTypeSchema.default('text'),
  solutionInputType: z.enum(['text']).default('text'),
  /**
   * Single source of truth for text answers while authoring.
   * Export currently writes only the first answer per locale because the
   * Flutter text-riddle contract still expects a single `solution` string.
   */
  acceptedAnswers: AcceptedAnswersSchema.default(emptyAcceptedAnswers()),
  en: RiddleLocaleSchema,
  de: RiddleLocaleSchema,
  it: RiddleLocaleSchema,
});

export const RiddleEntrySchema = z.preprocess(
  migrateLegacyRiddleEntryInput,
  AuthoringRiddleEntrySchema,
);

export const ExportRiddleEntrySchema = z.object({
  id: z.string(),
  number: z.number().int().nonnegative(),
  position_lat: z.number(),
  position_lng: z.number(),
  polylineString: z.string(),
  imagePath: z.string(),
  iconPath: z.string(),
  markerIconPath: z.string(),
  riddleType: RiddleTypeSchema.default('text'),
  solutionInputType: z.enum(['text']).default('text'),
  en: ExportRiddleLocaleSchema,
  de: ExportRiddleLocaleSchema,
  it: ExportRiddleLocaleSchema,
});

export type RiddleEntry = z.infer<typeof RiddleEntrySchema>;
export type RiddleLocaleContent = z.infer<typeof RiddleLocaleSchema>;
export type ExportRiddleEntry = z.infer<typeof ExportRiddleEntrySchema>;
export type ExportRiddleLocaleContent = z.infer<typeof ExportRiddleLocaleSchema>;
export type AcceptedAnswersByLocale = z.infer<typeof AcceptedAnswersSchema>;

export function emptyAcceptedAnswers(): AcceptedAnswersByLocale {
  return {
    en: [],
    de: [],
    it: [],
  };
}

export function normalizeAcceptedAnswersList(
  answers: readonly string[],
): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const answer of answers) {
    const trimmed = answer.trim();
    if (trimmed === '' || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function parseAcceptedAnswersInput(value: string): string[] {
  return normalizeAcceptedAnswersList(value.split(/[\n,]+/));
}

export function formatAcceptedAnswersInput(
  answers: readonly string[],
): string {
  return answers.join(', ');
}

export function getPrimaryAcceptedAnswer(
  acceptedAnswers: AcceptedAnswersByLocale,
  locale: Locale,
): string {
  return acceptedAnswers[locale][0] ?? '';
}

export function hasAcceptedAnswer(
  acceptedAnswers: AcceptedAnswersByLocale,
  locale: Locale,
): boolean {
  return getPrimaryAcceptedAnswer(acceptedAnswers, locale) !== '';
}

function migrateLegacyRiddleEntryInput(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }

  const migrated: Record<string, unknown> = {
    ...raw,
    acceptedAnswers: migrateAcceptedAnswers(raw),
  };

  for (const locale of LOCALES) {
    const localeValue = raw[locale];
    if (!isRecord(localeValue)) {
      continue;
    }
    const { solution: _solution, ...rest } = localeValue;
    migrated[locale] = rest;
  }

  return migrated;
}

function migrateAcceptedAnswers(
  raw: Record<string, unknown>,
): AcceptedAnswersByLocale {
  const acceptedAnswersInput = isRecord(raw.acceptedAnswers)
    ? raw.acceptedAnswers
    : null;
  const globalSolution = readLegacySolution(raw.solution);
  const migrated = emptyAcceptedAnswers();

  for (const locale of LOCALES) {
    if (acceptedAnswersInput && hasOwn(acceptedAnswersInput, locale)) {
      migrated[locale] = coerceAcceptedAnswers(acceptedAnswersInput[locale]);
      continue;
    }

    const localeValue = raw[locale];
    const localeSolution = isRecord(localeValue)
      ? readLegacySolution(localeValue.solution)
      : '';
    migrated[locale] = normalizeAcceptedAnswersList([
      localeSolution || globalSolution,
    ]);
  }

  return migrated;
}

function coerceAcceptedAnswers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeAcceptedAnswersList(
      value.filter((item): item is string => typeof item === 'string'),
    );
  }
  if (typeof value === 'string') {
    return normalizeAcceptedAnswersList([value]);
  }
  return [];
}

function readLegacySolution(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}
