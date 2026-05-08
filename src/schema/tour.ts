import { z } from 'zod';
import { ContentBlockSchema } from './contentBlock';
import {
  TourAdminMetaSchema,
  TourAIContextSchema,
  TourAuthoringMetaSchema,
  TourPublicMetaSchema,
  TourStoryMetaSchema,
} from './tourMeta';

/**
 * Tour metadata entry consumed by `Tour.fromJson` in `lib/models/tour.dart`.
 *
 * Matches the shape of entries in the webserver's top-level `tours.json`.
 */
export const TourLocaleSchema = z.object({
  title: z.string(),
  location: z.string(),
  duration: z.string(),
  description: z.array(ContentBlockSchema),
  introSection: z.array(ContentBlockSchema),
  outroSection: z.array(ContentBlockSchema),
  welcomeMessage: z.string().optional(),
});

export const TourEntrySchema = z.object({
  id: z.string(),
  number: z.number().int().nonnegative(),
  imagePath: z.string(),
  /**
   * Authoring-only pointer at a Dexie-stored cover photo blob. On export
   * the blob is written to `<slug>/images/<id>.webp` and `imagePath` is
   * rewritten to that path; this field is dropped from the JSON.
   */
  coverBlobId: z.string().optional(),
  riddlesPath: z.string(),
  distance: z.string(),
  unlocked: z.boolean(),
  code: z.string().optional(),
  hideUnsolvedRiddles: z.boolean().optional(),
  gpsRangeMeters: z.number().int().positive().optional(),
  en: TourLocaleSchema,
  de: TourLocaleSchema,
  it: TourLocaleSchema,
  /**
   * Optional layered metadata. See `tourMeta.ts` for why each block is
   * separate and which audience it serves. Pre-meta drafts still parse —
   * absent blocks are treated as empty by `createDefaultTourMeta`.
   */
  publicMeta: TourPublicMetaSchema.optional(),
  adminMeta: TourAdminMetaSchema.optional(),
  authoringMeta: TourAuthoringMetaSchema.optional(),
  aiContext: TourAIContextSchema.optional(),
  storyMeta: TourStoryMetaSchema.optional(),
});

export const ExportTourEntrySchema = z.object({
  id: z.string(),
  number: z.number().int().nonnegative(),
  imagePath: z.string(),
  riddlesPath: z.string(),
  distance: z.string(),
  unlocked: z.boolean(),
  code: z.string().optional(),
  hideUnsolvedRiddles: z.boolean().optional(),
  gpsRangeMeters: z.number().int().positive().optional(),
  en: TourLocaleSchema,
  de: TourLocaleSchema,
  it: TourLocaleSchema,
  publicMeta: TourPublicMetaSchema.optional(),
});

export type TourEntry = z.infer<typeof TourEntrySchema>;
export type ExportTourEntry = z.infer<typeof ExportTourEntrySchema>;
export type TourLocaleContent = z.infer<typeof TourLocaleSchema>;
