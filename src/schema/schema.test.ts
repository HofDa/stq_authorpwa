import { describe, expect, it } from 'vitest';
import {
  ContentBlockSchema,
  RiddleEntrySchema,
  RiddleLocaleSchema,
  TourDraftSchema,
  TourEntrySchema,
  TourLocaleSchema,
} from '@/schema';
import {
  buildValidDraft,
  buildValidStation,
  buildValidTour,
} from '@/test/fixtures';

describe('ContentBlockSchema', () => {
  it('accepts each block type', () => {
    expect(
      ContentBlockSchema.parse({ type: 'paragraph', text: 'hi' }),
    ).toEqual({ type: 'paragraph', text: 'hi' });
    expect(ContentBlockSchema.parse({ type: 'heading', text: 'hi' })).toEqual({
      type: 'heading',
      text: 'hi',
    });
    expect(ContentBlockSchema.parse({ type: 'line', text: '' })).toEqual({
      type: 'line',
      text: '',
    });
    expect(
      ContentBlockSchema.parse({ type: 'image', imagePath: 'x.webp' }),
    ).toEqual({ type: 'image', imagePath: 'x.webp' });
  });

  it('line blocks default text to empty string', () => {
    expect(ContentBlockSchema.parse({ type: 'line' })).toEqual({
      type: 'line',
      text: '',
    });
  });

  it('rejects unknown types', () => {
    expect(() =>
      ContentBlockSchema.parse({ type: 'audio', src: 'x.mp3' }),
    ).toThrow();
  });
});

describe('TourEntrySchema', () => {
  it('parses a valid tour entry', () => {
    expect(() => TourEntrySchema.parse(buildValidTour())).not.toThrow();
  });

  it('rejects negative tour.number', () => {
    expect(() =>
      TourEntrySchema.parse({ ...buildValidTour(), number: -1 }),
    ).toThrow();
  });

  it('rejects non-positive gpsRangeMeters', () => {
    expect(() =>
      TourEntrySchema.parse({ ...buildValidTour(), gpsRangeMeters: 0 }),
    ).toThrow();
  });

  it('requires all three locales', () => {
    const tour = buildValidTour();
    const { de: _de, ...withoutDe } = tour;
    expect(() => TourEntrySchema.parse(withoutDe)).toThrow();
  });
});

describe('RiddleEntrySchema', () => {
  it('parses a valid station', () => {
    expect(() => RiddleEntrySchema.parse(buildValidStation())).not.toThrow();
  });

  it('rejects more than 3 hints', () => {
    const station = buildValidStation();
    const bad: typeof station = {
      ...station,
      en: { ...station.en, hints: ['a', 'b', 'c', 'd'] },
    };
    expect(() => RiddleLocaleSchema.parse(bad.en)).toThrow();
  });

  it('defaults riddleType and solutionInputType to text', () => {
    const { riddleType: _r, solutionInputType: _s, ...withoutDefaults } =
      buildValidStation();
    const parsed = RiddleEntrySchema.parse(withoutDefaults);
    expect(parsed.riddleType).toBe('text');
    expect(parsed.solutionInputType).toBe('text');
  });

  it('rejects an unknown riddle type', () => {
    expect(() =>
      RiddleEntrySchema.parse({
        ...buildValidStation(),
        riddleType: 'multiple-choice',
      }),
    ).toThrow();
  });
});

describe('TourLocaleSchema / RiddleLocaleSchema round-trip', () => {
  it('serializes and re-parses without loss', () => {
    const locale = buildValidTour().en;
    const roundTripped = TourLocaleSchema.parse(
      JSON.parse(JSON.stringify(locale)),
    );
    expect(roundTripped).toEqual(locale);
  });

  it('round-trips a riddle locale', () => {
    const locale = buildValidStation().en;
    const roundTripped = RiddleLocaleSchema.parse(
      JSON.parse(JSON.stringify(locale)),
    );
    expect(roundTripped).toEqual(locale);
  });
});

describe('TourDraftSchema', () => {
  it('parses a valid draft', () => {
    expect(() => TourDraftSchema.parse(buildValidDraft())).not.toThrow();
  });

  it('defaults recordedRoute to empty array', () => {
    const draft = buildValidDraft();
    const { recordedRoute: _r, ...withoutRoute } = draft;
    const parsed = TourDraftSchema.parse(withoutRoute);
    expect(parsed.recordedRoute).toEqual([]);
  });
});
