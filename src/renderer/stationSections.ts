/**
 * Canonical list of station content-section keys and their default
 * fallback titles. Shared by `RiddleScreen` (the runtime renderer),
 * `FieldInspector`, and `InlineStationDrawer` so the four sections stay
 * in sync everywhere.
 */
export type RendererSectionKey =
  | 'firstSection'
  | 'historySection'
  | 'riddleSection'
  | 'successSection';

export const STATION_SECTION_KEYS: readonly RendererSectionKey[] = [
  'firstSection',
  'historySection',
  'riddleSection',
  'successSection',
];

export const STATION_SECTION_FALLBACK_TITLES: Record<RendererSectionKey, string> = {
  firstSection: 'Story',
  historySection: 'Background',
  riddleSection: 'Riddle',
  successSection: 'Success',
};
