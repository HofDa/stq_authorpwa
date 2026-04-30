import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type RiddleEntry,
  type TourDraft,
  type TourEntry,
} from '@/schema';

function fallbackLocales(preferred: Locale): Locale[] {
  return Array.from(new Set([preferred, DEFAULT_LOCALE, ...LOCALES]));
}

export function pickLocalizedString(
  values: Partial<Record<Locale, string | undefined>>,
  preferred: Locale = DEFAULT_LOCALE,
  fallback = '',
): string {
  for (const locale of fallbackLocales(preferred)) {
    const value = values[locale]?.trim();
    if (value) return value;
  }
  return fallback;
}

export function getStationLocationLabel(
  station: RiddleEntry,
  preferred: Locale = DEFAULT_LOCALE,
  fallback = 'Unnamed station',
): string {
  return pickLocalizedString(
    {
      en: station.en.location,
      de: station.de.location,
      it: station.it.location,
    },
    preferred,
    fallback,
  );
}

export function getTourTitleLabel(
  tour: TourEntry | TourDraft['tour'],
  preferred: Locale = DEFAULT_LOCALE,
  fallback = 'Untitled tour',
): string {
  return pickLocalizedString(
    {
      en: tour.en.title,
      de: tour.de.title,
      it: tour.it.title,
    },
    preferred,
    fallback,
  );
}

export function getTourLocationLabel(
  tour: TourEntry | TourDraft['tour'],
  preferred: Locale = DEFAULT_LOCALE,
  fallback = 'Location pending',
): string {
  return pickLocalizedString(
    {
      en: tour.en.location,
      de: tour.de.location,
      it: tour.it.location,
    },
    preferred,
    fallback,
  );
}

export function getTourDurationLabel(
  tour: TourEntry | TourDraft['tour'],
  preferred: Locale = DEFAULT_LOCALE,
  fallback = '—',
): string {
  return pickLocalizedString(
    {
      en: tour.en.duration,
      de: tour.de.duration,
      it: tour.it.duration,
    },
    preferred,
    fallback,
  );
}
