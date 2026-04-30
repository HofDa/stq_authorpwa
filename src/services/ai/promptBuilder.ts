import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { LOCALES } from '@/schema';
import type { PromptContextInput } from './aiTypes';

/**
 * Builds redacted, prompt-ready context strings from a `TourDraft`.
 *
 * Importantly, blob ids and `imagePath` (which can leak local file paths)
 * are stripped here so the `aiClient.runAction()` boundary never sees them.
 */
export function buildTourContext(input: PromptContextInput): Record<string, string> {
  const { draft, locale } = input;
  const tour = draft.tour;
  const localized = tour[locale];

  return {
    title: localized.title,
    location: localized.location,
    duration: localized.duration,
    distance: tour.distance,
    intro: blocksToPlainText(localized.introSection),
    outro: blocksToPlainText(localized.outroSection),
    description: blocksToPlainText(localized.description),
    languages: LOCALES.filter((l) => tour[l].title.trim()).join(','),
    stationCount: String(draft.stations.length),
  };
}

export function buildStationContext(
  draft: TourDraft,
  locale: Locale,
  stationId: string,
): Record<string, string> | null {
  const station = draft.stations.find((s) => s.id === stationId);
  if (!station) return null;
  return stationToContext(station, locale);
}

/**
 * Helper for translation-completeness style actions: returns one entry per
 * locale, listing the missing top-level fields. Already redacted.
 */
export function buildTranslationGaps(draft: TourDraft): Record<string, string> {
  const gaps: Record<string, string> = {};
  for (const locale of LOCALES) {
    const tour = draft.tour[locale];
    const missing: string[] = [];
    if (!tour.title.trim()) missing.push('title');
    if (tour.introSection.length === 0) missing.push('intro');
    if (tour.outroSection.length === 0) missing.push('outro');
    gaps[locale] = missing.join(',');
  }
  return gaps;
}

function stationToContext(
  station: RiddleEntry,
  locale: Locale,
): Record<string, string> {
  const localized = station[locale];
  return {
    stationNumber: String(station.number),
    stationName: localized.location,
    storyExcerpt: blocksToPlainText(localized.firstSection).slice(0, 600),
    historyExcerpt: blocksToPlainText(localized.historySection).slice(0, 600),
    riddle: blocksToPlainText(localized.riddleSection).slice(0, 400),
    success: blocksToPlainText(localized.successSection).slice(0, 200),
    primaryAnswer: station.acceptedAnswers[locale][0] ?? '',
    hasGps: String(
      station.position_lat !== 0 || station.position_lng !== 0,
    ),
  };
}

function blocksToPlainText(blocks: { type: string; text?: string }[]): string {
  return blocks
    .map((block) => block.text ?? '')
    .filter((text) => text.length > 0)
    .join('\n\n')
    .trim();
}
