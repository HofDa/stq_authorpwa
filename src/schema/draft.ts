import { z } from 'zod';
import { TourEntrySchema } from './tour';
import { RiddleEntrySchema } from './riddle';
import { RecordedRoutePointSchema } from './route';

export const StorylineMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  ts: z.number(),
});

/**
 * Author-only narrative bible for the tour. The markdown is referenced by
 * the per-station AI assistant so per-station suggestions stay consistent
 * with the overarching arc, tone, hooks, and twists. Not exported — lives
 * only in the local draft.
 */
export const StorylineSchema = z.object({
  markdown: z.string().default(''),
  updatedAt: z.number().default(0),
  chat: z.array(StorylineMessageSchema).default([]),
});

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
  storyline: StorylineSchema.default({ markdown: '', updatedAt: 0, chat: [] }),
});

export type StorylineMessage = z.infer<typeof StorylineMessageSchema>;
export type Storyline = z.infer<typeof StorylineSchema>;
export type TourDraft = z.infer<typeof TourDraftSchema>;
