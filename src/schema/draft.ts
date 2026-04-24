import { z } from 'zod';
import { TourEntrySchema } from './tour';
import { RiddleEntrySchema } from './riddle';
import { RecordedRoutePointSchema } from './route';

/**
 * A `TourDraft` is the full authoring state for one tour:
 * tour metadata + the array of riddles/stations.
 *
 * On export, this is serialized as:
 *   - one entry appended to the global `tours.json`
 *   - one `<slug>/riddles.json` containing the station array
 *   - image blobs resolved to `<slug>/images/<id>.webp`
 */
export const TourDraftSchema = z.object({
  draftId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  tour: TourEntrySchema,
  stations: z.array(RiddleEntrySchema),
  recordedRoute: z.array(RecordedRoutePointSchema).default([]),
});

export type TourDraft = z.infer<typeof TourDraftSchema>;
