export const TOUR_META_TAB_IDS = [
  'public',
  'internal',
  'authoring',
  'aiContext',
  'story',
] as const;

export type TourMetaTabId = (typeof TOUR_META_TAB_IDS)[number];
