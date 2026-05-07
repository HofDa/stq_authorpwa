import { z } from 'zod';
import { ContentBlockSchema } from './contentBlock';
import { LOCALES, type Locale } from './locales';
import { STATION_COLOR_KEYS, STATION_ICON_KEYS } from '@/stations/visuals';
import {
  RRR_INTERACTION_VERSION,
  RRR_CONDITION_TYPES,
  RRR_GROUP_CONDITION_TYPES,
  RRR_MODULE_TYPES,
  type RrrCondition,
  type RrrConditionType,
  type RrrInteraction,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';

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

export const RiddleTypeSchema = z.enum(['text', 'modular']);

export const RrrModuleTypeSchema = z.enum(RRR_MODULE_TYPES);

export const RrrConditionTypeSchema = z.enum(RRR_CONDITION_TYPES);

export const RrrModuleSchema = z.object({
  id: z.string().trim().min(1),
  type: RrrModuleTypeSchema,
  label: z.string().trim().min(1),
  config: z.record(z.unknown()).default({}),
  timeoutMs: z.number().int().positive().optional(),
  retry: z
    .object({
      maxAttempts: z.number().int().positive().optional(),
      resetOnFail: z.boolean().optional(),
    })
    .optional(),
});

export const RrrConditionSchema: z.ZodType<RrrCondition> =
  z.lazy(() =>
    z.union([
      z.object({
        type: z.literal('module'),
        moduleId: z.string().trim().min(1),
      }),
      z.object({
        type: z.literal('sequence'),
        steps: z.array(RrrConditionSchema).min(1),
      }),
      z.object({
        type: z.literal('sequence'),
        children: z.array(RrrConditionSchema).min(1),
      }),
      z.object({
        type: z.enum(RRR_GROUP_CONDITION_TYPES),
        children: z.array(RrrConditionSchema).min(1),
      }),
    ]),
  );

export const RrrInteractionSchema = z
  .object({
    schemaVersion: z.literal(1),
    modules: z.array(RrrModuleSchema),
    condition: RrrConditionSchema.optional(),
  })
  .superRefine((interaction, ctx) => {
    const moduleIds = new Set<string>();
    interaction.modules.forEach((module, index) => {
      if (moduleIds.has(module.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['modules', index, 'id'],
          message: `Module id "${module.id}" is duplicated.`,
        });
      }
      moduleIds.add(module.id);
    });

    if (!interaction.condition) {
      return;
    }

    visitConditionModules(interaction.condition, (moduleId) => {
      if (!moduleIds.has(moduleId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['condition'],
          message: `Condition references unknown module "${moduleId}".`,
        });
      }
    });
  });

const AcceptedAnswerListSchema = z
  .array(z.string())
  .default([])
  .transform(normalizeAcceptedAnswersList);

export const AcceptedAnswersSchema = z.object({
  en: AcceptedAnswerListSchema,
  de: AcceptedAnswerListSchema,
  it: AcceptedAnswerListSchema,
});

const AuthoringRiddleEntrySchema = z
  .object({
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
    interaction: RrrInteractionSchema.optional(),
    en: RiddleLocaleSchema,
    de: RiddleLocaleSchema,
    it: RiddleLocaleSchema,
  });

export const RiddleEntrySchema = z.preprocess(
  migrateLegacyRiddleEntryInput,
  AuthoringRiddleEntrySchema,
);

export const ExportRiddleEntrySchema = z
  .object({
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
    interactionVersion: z.literal(RRR_INTERACTION_VERSION).optional(),
    interaction: RrrInteractionSchema.optional(),
    en: ExportRiddleLocaleSchema,
    de: ExportRiddleLocaleSchema,
    it: ExportRiddleLocaleSchema,
  })
  .superRefine((station, ctx) => {
    if (station.riddleType !== 'modular') {
      return;
    }
    if (!station.interaction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interaction'],
        message: 'Modular riddles require an interaction object for export.',
      });
    }
    if (station.interactionVersion !== RRR_INTERACTION_VERSION) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['interactionVersion'],
        message: `Modular riddles require interactionVersion ${RRR_INTERACTION_VERSION} for export.`,
      });
    }
  });

export type RiddleEntry = z.infer<typeof RiddleEntrySchema>;
export type RiddleLocaleContent = z.infer<typeof RiddleLocaleSchema>;
export type ExportRiddleEntry = z.infer<typeof ExportRiddleEntrySchema>;
export type ExportRiddleLocaleContent = z.infer<typeof ExportRiddleLocaleSchema>;
export type AcceptedAnswersByLocale = z.infer<typeof AcceptedAnswersSchema>;
export type {
  RrrCondition,
  RrrConditionType,
  RrrInteraction,
  RrrModule,
  RrrModuleType,
};

export function createEmptyRrrInteraction(): RrrInteraction {
  return {
    schemaVersion: 1,
    modules: [],
    condition: undefined,
  };
}

export function createDefaultRrrInteraction(): RrrInteraction {
  return {
    schemaVersion: 1,
    modules: [
      {
        id: 'module-1',
        type: 'text_answer',
        label: 'Text answer',
        config: {},
      },
    ],
    condition: {
      type: 'module',
      moduleId: 'module-1',
    },
  };
}

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

function visitConditionModules(
  node: RrrCondition,
  visitor: (moduleId: string) => void,
) {
  if (node.type === 'module') {
    visitor(node.moduleId);
    return;
  }
  const children = 'steps' in node ? node.steps : node.children;
  for (const child of children) {
    visitConditionModules(child, visitor);
  }
}
