import { describe, expect, it } from 'vitest';
import {
  emptyRiddleLocale,
  type Locale,
} from '@/schema';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { stationCompleteness, tourCompleteness } from './completeness';

function clearLocale(station: ReturnType<typeof buildValidStation>, locale: Locale) {
  station[locale] = emptyRiddleLocale();
}

describe('stationCompleteness', () => {
  it('treats German content as complete while English stays incomplete', () => {
    const station = buildValidStation();
    clearLocale(station, 'en');

    expect(stationCompleteness(station, 'de').percent).toBe(100);
    expect(stationCompleteness(station, 'de').blockCount).toBeGreaterThan(0);
    expect(stationCompleteness(station, 'en').percent).toBe(75);
    expect(stationCompleteness(station, 'en').blockCount).toBe(0);
    expect(stationCompleteness(station, 'en').hasSuccessMessage).toBe(false);
  });

  it('treats English content as complete while German stays incomplete', () => {
    const station = buildValidStation();
    clearLocale(station, 'de');

    expect(stationCompleteness(station, 'en').percent).toBe(100);
    expect(stationCompleteness(station, 'de').percent).toBe(75);
    expect(stationCompleteness(station, 'de').blockCount).toBe(0);
  });

  it('evaluates Italian independently', () => {
    const station = buildValidStation();
    clearLocale(station, 'en');
    clearLocale(station, 'de');

    expect(stationCompleteness(station, 'it').percent).toBe(100);
    expect(stationCompleteness(station, 'en').percent).toBe(75);
    expect(stationCompleteness(station, 'de').percent).toBe(75);
  });

  it('keeps GPS and photo checks global across locales', () => {
    const station = buildValidStation();
    clearLocale(station, 'de');

    const english = stationCompleteness(station, 'en');
    const german = stationCompleteness(station, 'de');
    expect(english.hasPhoto).toBe(true);
    expect(german.hasPhoto).toBe(true);
    expect(english.hasGps).toBe(true);
    expect(german.hasGps).toBe(true);

    station.imageBlobId = undefined;
    station.imagePath = '';
    station.position_lat = 0;
    station.position_lng = 0;

    const englishWithoutAssets = stationCompleteness(station, 'en');
    const germanWithoutAssets = stationCompleteness(station, 'de');
    expect(englishWithoutAssets.hasPhoto).toBe(false);
    expect(germanWithoutAssets.hasPhoto).toBe(false);
    expect(englishWithoutAssets.hasGps).toBe(false);
    expect(germanWithoutAssets.hasGps).toBe(false);
  });
});

describe('tourCompleteness', () => {
  it('uses the active locale when counting ready stations', () => {
    const draft = buildValidDraft();
    const second = buildValidStation('station-2', 2);
    clearLocale(draft.stations[0], 'en');
    clearLocale(second, 'en');
    clearLocale(second, 'de');
    draft.stations.push(second);

    expect(tourCompleteness(draft, 'de')).toEqual({
      ready: 1,
      total: 2,
      percent: 50,
    });
    expect(tourCompleteness(draft, 'en')).toEqual({
      ready: 0,
      total: 2,
      percent: 0,
    });
  });
});
