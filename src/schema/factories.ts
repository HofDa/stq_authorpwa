import type { TourDraft } from './draft';
import type { TourEntry, TourLocaleContent } from './tour';
import type { RiddleEntry, RiddleLocaleContent } from './riddle';
import { LOCALES, type Locale } from './locales';

export function createId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export function emptyTourLocale(): TourLocaleContent {
  return {
    title: '',
    location: '',
    duration: '',
    description: [],
    introSection: [],
    outroSection: [],
  };
}

export function emptyRiddleLocale(): RiddleLocaleContent {
  return {
    location: '',
    firstSection: [],
    historySection: [],
    riddleSection: [],
    successSection: [],
    hints: [],
    solution: '',
  };
}

function localeMap<T>(factory: () => T): Record<Locale, T> {
  return LOCALES.reduce(
    (acc, locale) => {
      acc[locale] = factory();
      return acc;
    },
    {} as Record<Locale, T>,
  );
}

export function emptyTour(id: string): TourEntry {
  return {
    id,
    number: 0,
    imagePath: '',
    riddlesPath: `${id}/${id}.json`,
    distance: '',
    unlocked: true,
    ...localeMap(emptyTourLocale),
  };
}

export function emptyStation(id: string, number: number): RiddleEntry {
  return {
    id,
    number,
    position_lat: 0,
    position_lng: 0,
    polylineString: '',
    imagePath: '',
    iconPath: '',
    markerIconPath: '',
    riddleType: 'text',
    solutionInputType: 'text',
    solution: '',
    ...localeMap(emptyRiddleLocale),
  };
}

export function emptyDraft(): TourDraft {
  const slug = createId('tour');
  const now = Date.now();
  return {
    draftId: slug,
    createdAt: now,
    updatedAt: now,
    tour: emptyTour(slug),
    stations: [],
  };
}
