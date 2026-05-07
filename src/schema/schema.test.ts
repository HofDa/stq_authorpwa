import { describe, expect, it } from 'vitest';
import {
  ContentBlockSchema,
  ExportRiddleEntrySchema,
  RiddleEntrySchema,
  RiddleLocaleSchema,
  RrrConditionSchema,
  RrrInteractionSchema,
  RrrModuleSchema,
  TourDraftSchema,
  TourEntrySchema,
  TourLocaleSchema,
  createEmptyRrrInteraction,
  createDefaultRrrInteraction,
  emptyStation,
  withRiddleType,
} from '@/schema';
import {
  buildValidDraft,
  buildValidStation,
  buildValidTour,
} from '@/test/fixtures';
import { RRR_COMPOSITE_CONDITION_TYPES, RRR_MODULE_TYPES } from '@/rrr';

describe('ContentBlockSchema', () => {
  it('accepts each block type', () => {
    expect(
      ContentBlockSchema.parse({ type: 'paragraph', text: 'hi' }),
    ).toEqual({ type: 'paragraph', text: 'hi' });
    expect(
      ContentBlockSchema.parse({ type: 'paragraph_styled', text: 'hi' }),
    ).toEqual({ type: 'paragraph_styled', text: 'hi' });
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

  it('accepts a modular station with an interaction graph', () => {
    expect(() =>
      RiddleEntrySchema.parse({
        ...buildValidStation(),
        riddleType: 'modular',
        interaction: createDefaultRrrInteraction(),
      }),
    ).not.toThrow();
  });

  it('does not require modular stations to have an interaction yet', () => {
    expect(() =>
      RiddleEntrySchema.parse({
        ...buildValidStation(),
        riddleType: 'modular',
      }),
    ).not.toThrow();
  });

  it('requires interactionVersion on exported modular stations', () => {
    const station = buildValidStation();
    const interaction = createDefaultRrrInteraction();

    expect(() =>
      ExportRiddleEntrySchema.parse({
        ...station,
        riddleType: 'modular',
        interactionVersion: 1,
        interaction,
        en: { ...station.en, solution: 'tower' },
        de: { ...station.de, solution: 'turm' },
        it: { ...station.it, solution: 'torre' },
      }),
    ).not.toThrow();

    expect(() =>
      ExportRiddleEntrySchema.parse({
        ...station,
        riddleType: 'modular',
        interaction,
        en: { ...station.en, solution: 'tower' },
        de: { ...station.de, solution: 'turm' },
        it: { ...station.it, solution: 'torre' },
      }),
    ).toThrow();
  });

  it('keeps interaction optional for text stations', () => {
    const { interaction: _interaction, ...station } = {
      ...buildValidStation(),
      interaction: createDefaultRrrInteraction(),
    };

    const parsed = RiddleEntrySchema.parse({
      ...station,
      riddleType: 'text',
    });

    expect(parsed.riddleType).toBe('text');
    expect(parsed).not.toHaveProperty('interaction');
  });

  it('keeps new stations on the existing text-riddle defaults', () => {
    const station = emptyStation('station-new', 1);

    expect(station.riddleType).toBe('text');
    expect(station.solutionInputType).toBe('text');
    expect(station).not.toHaveProperty('interaction');
    expect(() => RiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('rejects an unknown riddle type', () => {
    expect(() =>
      RiddleEntrySchema.parse({
        ...buildValidStation(),
        riddleType: 'multiple-choice',
      }),
    ).toThrow();
  });

  it('migrates legacy global and localized solution fields into acceptedAnswers', () => {
    const legacyStation = {
      ...buildValidStation(),
      acceptedAnswers: undefined,
      solution: 'tower',
      en: { ...buildValidStation().en },
      de: { ...buildValidStation().de, solution: 'turm' },
      it: { ...buildValidStation().it, solution: 'torre' },
    };

    const parsed = RiddleEntrySchema.parse(legacyStation);

    expect(parsed.acceptedAnswers.en).toEqual(['tower']);
    expect(parsed.acceptedAnswers.de).toEqual(['turm']);
    expect(parsed.acceptedAnswers.it).toEqual(['torre']);
    expect(parsed.en).not.toHaveProperty('solution');
    expect(parsed.de).not.toHaveProperty('solution');
    expect(parsed.it).not.toHaveProperty('solution');
  });
});

describe('RRR interaction schemas', () => {
  it('accepts an empty authoring interaction as a safe draft state', () => {
    expect(RrrInteractionSchema.parse(createEmptyRrrInteraction())).toEqual({
      schemaVersion: 1,
      modules: [],
      condition: undefined,
    });
  });

  it('accepts the initial module types', () => {
    for (const type of RRR_MODULE_TYPES) {
      expect(() =>
        RrrModuleSchema.parse({
          id: `module-${type}`,
          type,
          label: type,
          config: {},
        }),
      ).not.toThrow();
    }
  });

  it('accepts the initial condition graph types', () => {
    for (const type of RRR_COMPOSITE_CONDITION_TYPES) {
      expect(() =>
        RrrConditionSchema.parse({
          type,
          children: [{ type: 'module', moduleId: 'module-1' }],
        }),
      ).not.toThrow();
    }
  });

  it('accepts future sequence steps and nested condition trees', () => {
    expect(() =>
      RrrConditionSchema.parse({
        type: 'sequence',
        steps: [
          { type: 'module', moduleId: 'face_north' },
          {
            type: 'all_of',
            children: [
              { type: 'module', moduleId: 'hold_still' },
              { type: 'module', moduleId: 'gps_enter' },
            ],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects invalid module and condition types', () => {
    expect(() =>
      RrrModuleSchema.parse({
        id: 'module-1',
        type: 'shake',
        label: 'Shake',
        config: {},
      }),
    ).toThrow();

    expect(() =>
      RrrConditionSchema.parse({
        type: 'not',
        children: [{ type: 'module', moduleId: 'module-1' }],
      }),
    ).toThrow();
  });

  it('rejects condition references to unknown modules', () => {
    expect(() =>
      RrrInteractionSchema.parse({
        schemaVersion: 1,
        modules: [
          {
            id: 'module-1',
            type: 'text_answer',
            label: 'Text answer',
            config: {},
          },
        ],
        condition: { type: 'module', moduleId: 'missing-module' },
      }),
    ).toThrow(/unknown module/i);
  });
});

describe('riddle type factory helpers', () => {
  it('initializes an empty interaction when switching to modular', () => {
    const station = buildValidStation();
    const modular = withRiddleType(station, 'modular');

    expect(modular.riddleType).toBe('modular');
    expect(modular.interaction).toEqual(createEmptyRrrInteraction());
    expect(() => RiddleEntrySchema.parse(modular)).not.toThrow();
  });

  it('preserves an existing interaction when switching to modular again', () => {
    const interaction = createDefaultRrrInteraction();
    const station = {
      ...buildValidStation(),
      riddleType: 'modular' as const,
      interaction,
    };

    const modular = withRiddleType(station, 'modular');

    expect(modular.interaction).toBe(interaction);
  });

  it('switches back to text without breaking the station', () => {
    const modular = withRiddleType(buildValidStation(), 'modular');
    const text = withRiddleType(modular, 'text');

    expect(text.riddleType).toBe('text');
    expect(text.interaction).toEqual(createEmptyRrrInteraction());
    expect(() => RiddleEntrySchema.parse(text)).not.toThrow();
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

  it('parses an exported riddle with localized solutions', () => {
    expect(() =>
      ExportRiddleEntrySchema.parse({
        ...buildValidStation(),
        acceptedAnswers: undefined,
        en: { ...buildValidStation().en, solution: 'tower' },
        de: { ...buildValidStation().de, solution: 'turm' },
        it: { ...buildValidStation().it, solution: 'torre' },
      }),
    ).not.toThrow();
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
