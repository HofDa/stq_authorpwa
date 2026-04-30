import { describe, expect, it } from 'vitest';
import { TourEntrySchema } from './tour';
import {
  TOUR_META_SCHEMA_VERSION,
  createDefaultTourMeta,
} from './tourMeta';
import { emptyTour } from './factories';

describe('createDefaultTourMeta', () => {
  it('creates separated meta blocks', () => {
    const bundle = createDefaultTourMeta();
    expect(bundle).toHaveProperty('publicMeta');
    expect(bundle).toHaveProperty('adminMeta');
    expect(bundle).toHaveProperty('authoringMeta');
    expect(bundle).toHaveProperty('aiContext');
    expect(bundle).toHaveProperty('storyMeta');
  });

  it('does not put story fields into aiContext', () => {
    const bundle = createDefaultTourMeta();
    expect(bundle.aiContext).not.toHaveProperty('premise');
    expect(bundle.aiContext).not.toHaveProperty('characters');
    expect(bundle.aiContext).not.toHaveProperty('arc');
    expect(bundle.storyMeta).not.toHaveProperty('guardrails');
    expect(bundle.storyMeta).not.toHaveProperty('preferredRiddleTypes');
  });

  it('sets default schemaVersion', () => {
    const bundle = createDefaultTourMeta();
    expect(bundle.adminMeta.schemaVersion).toBe(TOUR_META_SCHEMA_VERSION);
  });

  it('defaults the status to draft', () => {
    expect(createDefaultTourMeta().adminMeta.status).toBe('draft');
  });

  it('respects an overridden status', () => {
    expect(
      createDefaultTourMeta({ status: 'idea' }).adminMeta.status,
    ).toBe('idea');
  });

  it('uses the injected clock for timestamps', () => {
    const fixed = new Date('2024-01-15T10:00:00.000Z');
    const bundle = createDefaultTourMeta({ now: () => fixed });
    expect(bundle.adminMeta.createdAt).toBe(fixed.toISOString());
    expect(bundle.adminMeta.updatedAt).toBe(fixed.toISOString());
  });
});

describe('TourEntrySchema with meta', () => {
  it('parses tours that pre-date the meta blocks', () => {
    const tour = emptyTour('tour-legacy');
    const stripped = {
      ...tour,
      publicMeta: undefined,
      adminMeta: undefined,
      authoringMeta: undefined,
      aiContext: undefined,
      storyMeta: undefined,
    };
    const parsed = TourEntrySchema.parse(stripped);
    expect(parsed.publicMeta).toBeUndefined();
    expect(parsed.adminMeta).toBeUndefined();
    expect(parsed.storyMeta).toBeUndefined();
  });

  it('round-trips a tour with all five meta blocks populated', () => {
    const tour = emptyTour('tour-meta');
    tour.publicMeta = {
      themes: ['birds', 'biodiversity'],
      audience: ['families', 'children_8_12'],
      difficulty: { walking: 'easy', riddle: 'medium' },
      durationMinutes: 90,
      seasons: ['spring', 'summer'],
      practicalInfo: { dogsAllowed: true, availableOffline: true },
    };
    tour.aiContext = {
      assistantRole: 'You are an editor for a family-friendly tour.',
      guardrails: ['do_not_invent_history', 'separate_story_and_meta'],
      preferredRiddleTypes: ['observation', 'counting'],
    };
    tour.storyMeta = {
      premise: 'Two siblings unlocking the city\'s old guild secrets.',
      characters: [
        { name: 'Lia', role: 'Curious sibling', personality: 'Brave' },
      ],
    };
    const parsed = TourEntrySchema.parse(tour);
    expect(parsed.publicMeta?.themes).toContain('birds');
    expect(parsed.aiContext?.guardrails).toContain('do_not_invent_history');
    expect(parsed.storyMeta?.characters?.[0]?.name).toBe('Lia');
    expect(parsed.aiContext).not.toHaveProperty('premise');
  });
});
