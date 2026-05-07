import { describe, expect, it } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import compassHoldExample from './examples/compass-hold.example.json';
import gpsCompassSequenceExample from './examples/gps-compass-sequence.example.json';
import textAnswerExample from './examples/text-answer.example.json';

const examples = [
  ['text answer', textAnswerExample],
  ['compass and hold still', compassHoldExample],
  ['GPS and compass sequence', gpsCompassSequenceExample],
] as const;

describe('RRR authoring examples', () => {
  it.each(examples)('%s passes interaction schema validation', (_name, example) => {
    expect(() => RrrInteractionSchema.parse(example)).not.toThrow();
  });

  it('covers all MVP module types', () => {
    const moduleTypes = new Set(
      examples.flatMap(([, example]) =>
        RrrInteractionSchema.parse(example).modules.map((module) => module.type),
      ),
    );

    expect(moduleTypes).toEqual(
      new Set(['text_answer', 'compass_align', 'hold_still', 'gps_enter']),
    );
  });
});
