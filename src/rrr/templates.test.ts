import { describe, expect, it } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import {
  RRR_TEMPLATES,
  getRrrTemplate,
  type RrrTemplateId,
} from './templates';

const REQUIRED_TEMPLATES: Array<{ id: RrrTemplateId; label: string }> = [
  { id: 'simple_text_answer', label: 'Simple text answer' },
  { id: 'compass_only', label: 'Compass only' },
  { id: 'compass_then_hold_still', label: 'Compass then hold still' },
  { id: 'gps_then_compass', label: 'GPS then compass' },
  { id: 'any_text_or_compass', label: 'Any of text answer or compass' },
];

describe('RRR_TEMPLATES', () => {
  it('exposes the five required templates', () => {
    expect(RRR_TEMPLATES).toHaveLength(REQUIRED_TEMPLATES.length);
    for (const { id, label } of REQUIRED_TEMPLATES) {
      const template = getRrrTemplate(id);
      expect(template.id).toBe(id);
      expect(template.label).toBe(label);
      expect(template.description.length).toBeGreaterThan(0);
    }
  });

  it.each(REQUIRED_TEMPLATES.map(({ id }) => id))(
    'template %s validates against the schema',
    (id) => {
      const template = getRrrTemplate(id);
      const result = RrrInteractionSchema.safeParse(template.interaction);
      expect(result.success).toBe(true);
    },
  );

  it('throws on unknown template ids', () => {
    expect(() => getRrrTemplate('nope' as RrrTemplateId)).toThrow();
  });
});
