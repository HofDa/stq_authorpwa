import { z } from 'zod';
import { LOCALES, LocaleSchema } from './locales';

/**
 * Author-only metadata layered onto every tour. The structure is split on
 * purpose — different blocks have different audiences and guardrails:
 *
 *   publicMeta     → fields a future end-user app may render
 *   adminMeta      → internal status, ownership, rights clearance
 *   authoringMeta  → editorial intent (audience, tone, learning goals)
 *   aiContext      → guardrails and rules the AI assistant must follow
 *   storyMeta      → premise, characters, narrative arc (kept distinct
 *                    from aiContext so internal AI rules never leak into
 *                    the player-visible story)
 *
 * Every field is optional. Existing drafts that pre-date these blocks
 * still load and round-trip cleanly.
 */

export const TOUR_META_STATUSES = [
  'idea',
  'research',
  'field_capture',
  'draft',
  'content_review',
  'translation_review',
  'playtest_ready',
  'tested',
  'approved',
  'published',
  'archived',
] as const;

export const TourMetaStatusSchema = z.enum(TOUR_META_STATUSES);
export type TourMetaStatus = z.infer<typeof TourMetaStatusSchema>;

export const DIFFICULTY_LEVELS = ['very_easy', 'easy', 'medium', 'hard'] as const;
export const DifficultyLevelSchema = z.enum(DIFFICULTY_LEVELS);
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

/**
 * Per-locale string. Unlike the full `TourLocaleSchema`, this only carries
 * a single string per locale — used for short fields like subtitles or
 * localised slugs where a content-block array would be overkill. Every
 * locale key is optional so partial translations stay valid.
 */
export const LocalizedStringSchema = z
  .object(
    LOCALES.reduce(
      (acc, locale) => {
        acc[locale] = z.string().optional();
        return acc;
      },
      {} as Record<(typeof LOCALES)[number], z.ZodOptional<z.ZodString>>,
    ),
  )
  .partial();
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

export const SeasonSchema = z.enum([
  'spring',
  'summer',
  'autumn',
  'winter',
  'year_round',
]);
export type Season = z.infer<typeof SeasonSchema>;

export const PracticalInfoSchema = z.object({
  strollerFriendly: z.boolean().optional(),
  wheelchairFriendly: z.boolean().optional(),
  dogsAllowed: z.boolean().optional(),
  publicTransportNearby: z.boolean().optional(),
  parkingNearby: z.boolean().optional(),
  toiletNearby: z.boolean().optional(),
  daylightOnly: z.boolean().optional(),
  availableOffline: z.boolean().optional(),
  requiresInternet: z.boolean().optional(),
});
export type PracticalInfo = z.infer<typeof PracticalInfoSchema>;

export const TourPublicMetaSchema = z.object({
  subtitle: LocalizedStringSchema.optional(),
  slug: z.string().optional(),
  shortDescription: LocalizedStringSchema.optional(),
  longDescription: LocalizedStringSchema.optional(),
  themes: z.array(z.string()).optional(),
  audience: z.array(z.string()).optional(),
  durationMinutes: z.number().int().positive().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  difficulty: z
    .object({
      walking: DifficultyLevelSchema.optional(),
      riddle: DifficultyLevelSchema.optional(),
    })
    .optional(),
  languages: z.array(LocaleSchema).optional(),
  defaultLanguage: LocaleSchema.optional(),
  practicalInfo: PracticalInfoSchema.optional(),
  seasons: z.array(SeasonSchema).optional(),
});
export type TourPublicMeta = z.infer<typeof TourPublicMetaSchema>;

export const TourAdminRightsSchema = z.object({
  imageRightsCleared: z.boolean().optional(),
  audioRightsCleared: z.boolean().optional(),
  usesThirdPartyContent: z.boolean().optional(),
  requiresMunicipalityApproval: z.boolean().optional(),
  municipalityApprovalReceived: z.boolean().optional(),
  privatePropertyChecked: z.boolean().optional(),
  publicPathsChecked: z.boolean().optional(),
});
export type TourAdminRights = z.infer<typeof TourAdminRightsSchema>;

export const TOUR_ADMIN_VISIBILITIES = ['public', 'unlisted', 'private'] as const;
export const TourAdminVisibilitySchema = z.enum(TOUR_ADMIN_VISIBILITIES);
export type TourAdminVisibility = z.infer<typeof TourAdminVisibilitySchema>;

export const TOUR_ADMIN_PROJECT_TYPES = [
  'commissioned_tour',
  'self_initiated',
  'demo',
  'experiment',
] as const;
export const TourAdminProjectTypeSchema = z.enum(TOUR_ADMIN_PROJECT_TYPES);
export type TourAdminProjectType = z.infer<typeof TourAdminProjectTypeSchema>;

export const TourAdminBusinessSchema = z.object({
  client: z.string().optional(),
  sponsor: z.string().optional(),
  projectType: TourAdminProjectTypeSchema.optional(),
  visibility: TourAdminVisibilitySchema.optional(),
  maintenanceIncluded: z.boolean().optional(),
  maintenanceUntil: z.string().optional(),
});
export type TourAdminBusiness = z.infer<typeof TourAdminBusinessSchema>;

export const TourAdminTeamSchema = z.object({
  contentLead: z.string().optional(),
  fieldResearcher: z.string().optional(),
  translator: z.string().optional(),
  technicalReviewer: z.string().optional(),
});
export type TourAdminTeam = z.infer<typeof TourAdminTeamSchema>;

export const TourAdminMetaSchema = z.object({
  status: TourMetaStatusSchema.optional(),
  owner: z.string().optional(),
  schemaVersion: z.string().optional(),
  contentVersion: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  approvedForPublishing: z.boolean().optional(),
  client: z.string().optional(),
  rights: TourAdminRightsSchema.optional(),
  team: TourAdminTeamSchema.optional(),
  business: TourAdminBusinessSchema.optional(),
});
export type TourAdminMeta = z.infer<typeof TourAdminMetaSchema>;

export const TourAuthoringMetaSchema = z.object({
  primaryAudience: z.string().optional(),
  secondaryAudiences: z.array(z.string()).optional(),
  tone: z.array(z.string()).optional(),
  avoidTone: z.array(z.string()).optional(),
  readingLevel: z.string().optional(),
  learningGoals: z.array(z.string()).optional(),
  editorialRules: z.array(z.string()).optional(),
  didacticModes: z.array(z.string()).optional(),
});
export type TourAuthoringMeta = z.infer<typeof TourAuthoringMetaSchema>;

export const StationDraftRulesSchema = z.object({
  requiredSections: z.array(z.string()).optional(),
  maxCharactersPerStation: z.number().int().positive().optional(),
  hintsRequired: z.number().int().nonnegative().optional(),
});
export type StationDraftRules = z.infer<typeof StationDraftRulesSchema>;

export const SourcePolicySchema = z.object({
  mayUseProvidedSourcesOnly: z.boolean().optional(),
  mustMarkUnverifiedClaims: z.boolean().optional(),
  neverInventLocalHistory: z.boolean().optional(),
});
export type SourcePolicy = z.infer<typeof SourcePolicySchema>;

export const TourAIContextSchema = z.object({
  assistantRole: z.string().optional(),
  coreIdea: z.string().optional(),
  toneGuidelines: z.array(z.string()).optional(),
  preferredRiddleTypes: z.array(z.string()).optional(),
  avoidRiddleTypes: z.array(z.string()).optional(),
  guardrails: z.array(z.string()).optional(),
  safetyRules: z.array(z.string()).optional(),
  stationDraftRules: StationDraftRulesSchema.optional(),
  sourcePolicy: SourcePolicySchema.optional(),
});
export type TourAIContext = z.infer<typeof TourAIContextSchema>;

export const StoryCharacterSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  personality: z.string().optional(),
});
export type StoryCharacter = z.infer<typeof StoryCharacterSchema>;

export const StoryArcSchema = z.object({
  beginning: z.string().optional(),
  middle: z.string().optional(),
  ending: z.string().optional(),
});
export type StoryArc = z.infer<typeof StoryArcSchema>;

export const TourStoryMetaSchema = z.object({
  premise: z.string().optional(),
  characters: z.array(StoryCharacterSchema).optional(),
  arc: StoryArcSchema.optional(),
  recurringMotifs: z.array(z.string()).optional(),
  finale: z.string().optional(),
});
export type TourStoryMeta = z.infer<typeof TourStoryMetaSchema>;

export const TOUR_META_SCHEMA_VERSION = '1.0.0';

/**
 * The complete bundle returned by `createDefaultTourMeta`. We keep the
 * named export separate from `TourEntrySchema` so callers can pass an
 * empty bundle around (e.g. while creating a draft) before it's stamped
 * onto a tour.
 */
export interface TourMetaBundle {
  publicMeta: TourPublicMeta;
  adminMeta: TourAdminMeta;
  authoringMeta: TourAuthoringMeta;
  aiContext: TourAIContext;
  storyMeta: TourStoryMeta;
}

export function createDefaultTourMeta(
  options: { now?: () => Date; status?: TourMetaStatus } = {},
): TourMetaBundle {
  const now = (options.now ?? (() => new Date()))().toISOString();
  return {
    publicMeta: {},
    adminMeta: {
      status: options.status ?? 'draft',
      schemaVersion: TOUR_META_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    },
    authoringMeta: {},
    aiContext: {},
    storyMeta: {},
  };
}
