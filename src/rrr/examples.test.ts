import { describe, expect, it } from 'vitest';
import { RrrInteractionSchema } from '@/schema';
import codeWordExample from './examples/code-word.example.json';
import compassHoldExample from './examples/compass-hold.example.json';
import directionHotcoldExample from './examples/direction-hotcold.example.json';
import gpsCompassSequenceExample from './examples/gps-compass-sequence.example.json';
import multiChoiceExample from './examples/multi-choice.example.json';
import objectFoundExample from './examples/object-found.example.json';
import photoCheckManualExample from './examples/photo-check-manual.example.json';
import proximityHintExample from './examples/proximity-hint.example.json';
import qrScanExample from './examples/qr-scan.example.json';
import sequentialCodeExample from './examples/sequential-code.example.json';
import textAnswerExample from './examples/text-answer.example.json';
import timerWaitExample from './examples/timer-wait.example.json';

const examples = [
  ['text answer', textAnswerExample],
  ['multi choice', multiChoiceExample],
  ['compass and hold still', compassHoldExample],
  ['direction hot/cold', directionHotcoldExample],
  ['GPS and compass sequence', gpsCompassSequenceExample],
  ['proximity hint', proximityHintExample],
  ['QR scan', qrScanExample],
  ['code word', codeWordExample],
  ['sequential code', sequentialCodeExample],
  ['timer wait', timerWaitExample],
  ['manual photo check', photoCheckManualExample],
  ['object found', objectFoundExample],
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
      new Set([
        'text_answer',
        'multi_choice',
        'compass_align',
        'direction_hotcold',
        'hold_still',
        'gps_enter',
        'proximity_hint',
        'qr_scan',
        'code_word',
        'sequential_code',
        'timer_wait',
        'photo_check_manual',
        'object_found',
      ]),
    );
  });
});
