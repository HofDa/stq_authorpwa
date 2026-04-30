import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, type Locale } from '@/schema';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import {
  getStationLocationLabel,
  getTourDurationLabel,
  getTourLocationLabel,
  getTourTitleLabel,
  pickLocalizedString,
} from './localizedContent';

describe('localizedContent helpers', () => {
  it('uses German as the project default locale', () => {
    expect(DEFAULT_LOCALE).toBe('de');
  });

  it('prefers the requested locale before falling back to the default locale', () => {
    const values: Partial<Record<Locale, string>> = {
      de: 'Bozen',
      en: 'Bolzano',
      it: 'Bolzano IT',
    };

    expect(pickLocalizedString(values, 'it')).toBe('Bolzano IT');
    expect(pickLocalizedString({ de: 'Bozen' }, 'it')).toBe('Bozen');
    expect(pickLocalizedString({}, 'it', 'Fallback')).toBe('Fallback');
  });

  it('formats station labels from the active locale with German fallback', () => {
    const station = buildValidStation();
    station.de.location = 'Waltherplatz';
    station.it.location = 'Piazza Walther';
    station.en.location = '';

    expect(getStationLocationLabel(station, 'it')).toBe('Piazza Walther');
    expect(getStationLocationLabel(station, 'en')).toBe('Waltherplatz');
  });

  it('formats tour card labels from the configured default locale', () => {
    const draft = buildValidDraft();

    expect(getTourTitleLabel(draft.tour)).toBe('Bozen Klassisch');
    expect(getTourLocationLabel(draft.tour)).toBe('Bolzano');
    expect(getTourDurationLabel(draft.tour)).toBe('2h');
  });
});
