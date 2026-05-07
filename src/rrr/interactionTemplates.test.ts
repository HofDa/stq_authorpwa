import { describe, expect, it } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import { RRR_INTERACTION_TEMPLATES } from './interactionTemplates';

describe('RRR interaction templates', () => {
  it('creates schema-valid interactions for every template', () => {
    for (const template of RRR_INTERACTION_TEMPLATES) {
      expect(() =>
        RrrInteractionSchema.parse(template.createInteraction()),
      ).not.toThrow();
    }
  });

  it('covers the requested template set', () => {
    expect(RRR_INTERACTION_TEMPLATES.map((template) => template.id)).toEqual([
      'simple_text_answer',
      'face_direction',
      'compass_hold',
      'gps_compass_sequence',
      'qr_text_placeholder',
    ]);
  });

  it('returns fresh interactions so editor changes do not mutate templates', () => {
    const template = RRR_INTERACTION_TEMPLATES[0];
    const first = template.createInteraction();
    const second = template.createInteraction();

    first.modules[0].label = 'Changed';

    expect(second.modules[0].label).toBe('Textantwort');
  });
});
