import { z } from 'zod';
import { ContentBlockSchema } from './contentBlock';

/**
 * Riddle / station JSON entry consumed by `Riddle.fromJson` in
 * `lib/models/riddle.dart`.
 *
 * v1 only targets `text` riddles with `solutionInputType: "text"`.
 */
export const RiddleLocaleSchema = z.object({
  location: z.string(),
  firstSection: z.array(ContentBlockSchema),
  historySection: z.array(ContentBlockSchema),
  riddleSection: z.array(ContentBlockSchema),
  successSection: z.array(ContentBlockSchema),
  hints: z.array(z.string()).max(3),
  solution: z.string().optional(),
});

export const RiddleTypeSchema = z.enum(['text']);

export const RiddleEntrySchema = z.object({
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
  solution: z.string().optional(),
  en: RiddleLocaleSchema,
  de: RiddleLocaleSchema,
  it: RiddleLocaleSchema,
});

export type RiddleEntry = z.infer<typeof RiddleEntrySchema>;
export type RiddleLocaleContent = z.infer<typeof RiddleLocaleSchema>;
