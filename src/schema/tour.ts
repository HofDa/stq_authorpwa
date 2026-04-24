import { z } from 'zod';
import { ContentBlockSchema } from './contentBlock';

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
});

export type TourEntry = z.infer<typeof TourEntrySchema>;
export type TourLocaleContent = z.infer<typeof TourLocaleSchema>;
