import { z } from 'zod';

export const RecordedRoutePointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().nonnegative().optional(),
  timestamp: z.number().int().nonnegative(),
});

export type RecordedRoutePoint = z.infer<typeof RecordedRoutePointSchema>;
