import { describe, expect, it } from 'vitest';
import {
  TOUR_META_CHOICE_CATALOGS,
  aiGuardrailChoices,
  audienceChoices,
  findChoice,
  findChoiceLabel,
  riddleTypeChoices,
} from './choices';

describe('tourMetaChoices', () => {
  it('has unique ids per choice catalog', () => {
    for (const [name, options] of Object.entries(TOUR_META_CHOICE_CATALOGS)) {
      const ids = options.map((option) => option.id);
      const unique = new Set(ids);
      expect(unique.size, `duplicate ids in ${name}`).toBe(ids.length);
    }
  });

  it('has labels for all choices', () => {
    for (const [name, options] of Object.entries(TOUR_META_CHOICE_CATALOGS)) {
      for (const option of options) {
        expect(
          option.label.trim().length,
          `${name}.${option.id} missing label`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('contains recommended guardrails', () => {
    const recommended = aiGuardrailChoices.filter((option) => option.recommended);
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.map((option) => option.id)).toContain(
      'separate_story_and_meta',
    );
  });

  it('marks the kid-friendly audience as recommended', () => {
    const families = audienceChoices.find((option) => option.id === 'families');
    expect(families?.recommended).toBe(true);
  });

  it('keeps recommended riddle types low-friction', () => {
    const recommended = riddleTypeChoices
      .filter((option) => option.recommended)
      .map((option) => option.id);
    expect(recommended).toEqual(
      expect.arrayContaining(['observation', 'counting']),
    );
  });
});

describe('findChoice / findChoiceLabel', () => {
  it('resolves a known id back to its label', () => {
    expect(findChoice('audience', 'families')?.label).toBe('Familien');
    expect(findChoiceLabel('audience', 'families')).toBe('Familien');
  });

  it('falls back to the raw id when unknown', () => {
    expect(findChoice('audience', 'mystery_id')).toBeUndefined();
    expect(findChoiceLabel('audience', 'mystery_id')).toBe('mystery_id');
  });
});
