import { useCallback } from 'react';
import type {
  Locale,
  RiddleEntry,
  RiddleLocaleContent,
  TourDraft,
  TourLocaleContent,
} from '@/schema';

type DraftRecipe = (prev: TourDraft) => TourDraft;
type DraftSetter = (recipe: DraftRecipe) => void;

/**
 * Patch helpers for the tour-level locale content (`draft.tour[locale]`).
 */
export function useTourPatcher(onChange: DraftSetter, locale: Locale) {
  const patchLocale = useCallback(
    (patch: Partial<TourLocaleContent>) => {
      onChange((prev) => ({
        ...prev,
        tour: { ...prev.tour, [locale]: { ...prev.tour[locale], ...patch } },
      }));
    },
    [onChange, locale],
  );

  return { patchLocale };
}

/**
 * Patch helpers for a single station: top-level fields plus its locale content.
 */
export function useStationPatcher(
  onChange: DraftSetter,
  stationId: string,
  locale: Locale,
) {
  const patchStation = useCallback(
    (patch: Partial<RiddleEntry>) => {
      onChange((prev) => ({
        ...prev,
        stations: prev.stations.map((s) =>
          s.id === stationId ? { ...s, ...patch } : s,
        ),
      }));
    },
    [onChange, stationId],
  );

  const patchLocale = useCallback(
    (patch: Partial<RiddleLocaleContent>) => {
      onChange((prev) => ({
        ...prev,
        stations: prev.stations.map((s) =>
          s.id === stationId ? { ...s, [locale]: { ...s[locale], ...patch } } : s,
        ),
      }));
    },
    [onChange, stationId, locale],
  );

  return { patchStation, patchLocale };
}
