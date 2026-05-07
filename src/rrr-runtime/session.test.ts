import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { evaluateInteraction } from './evaluateInteraction';
import { reduceRrrRuntimeSession } from './reducer';
import { createRrrRuntimeSession, resetRrrRuntimeSession } from './session';

describe('RRR runtime session state', () => {
  it('progresses sequence steps and keeps completed modules completed', () => {
    const interaction = sequenceInteraction();
    let session = createRrrRuntimeSession();

    const stepOne = evaluateInteraction(
      interaction,
      { headingDegrees: 0, isStill: false },
      { textAnswer: '' },
      session,
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: stepOne,
    });

    expect(stepOne.status).toBe('running');
    expect(session.completedModuleIds).toContain('face_direction_1');
    expect(session.activeSequenceIndex).toBe(1);

    const stepTwo = evaluateInteraction(
      interaction,
      { headingDegrees: 180, isStill: true },
      { textAnswer: '' },
      session,
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: stepTwo,
    });

    expect(stepTwo.status).toBe('running');
    expect(stepTwo.modules.face_direction_1.status).toBe('running');
    expect(session.completedModuleIds).toEqual(
      expect.arrayContaining(['face_direction_1', 'hold_still_1']),
    );
    expect(session.activeSequenceIndex).toBe(2);

    const stepThree = evaluateInteraction(
      interaction,
      { headingDegrees: 180, isStill: false },
      { textAnswer: 'tower' },
      session,
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: stepThree,
    });

    expect(stepThree.status).toBe('success');
    expect(session.completedModuleIds).toEqual(
      expect.arrayContaining([
        'face_direction_1',
        'hold_still_1',
        'module_1',
      ]),
    );
    expect(session.activeSequenceIndex).toBe(3);
    expect(session.status).toBe('success');
  });

  it('reset clears sequence progress', () => {
    const session = reduceRrrRuntimeSession(
      {
        completedModuleIds: ['module_1'],
        activeSequenceIndex: 1,
        status: 'running',
      },
      { type: 'reset' },
    );

    expect(session).toEqual(resetRrrRuntimeSession());
  });
});

function sequenceInteraction(): RrrInteraction {
  return {
    schemaVersion: 1,
    modules: [
      {
        id: 'face_direction_1',
        type: 'compass_align',
        label: 'Face direction',
        config: { targetDegrees: 0, tolerance: 10 },
      },
      {
        id: 'hold_still_1',
        type: 'hold_still',
        label: 'Hold still',
        config: { durationMs: 3000 },
      },
      {
        id: 'module_1',
        type: 'text_answer',
        label: 'Text answer',
        config: { answer: 'tower', caseSensitive: false },
      },
    ],
    condition: {
      type: 'sequence',
      steps: [
        { type: 'module', moduleId: 'face_direction_1' },
        { type: 'module', moduleId: 'hold_still_1' },
        { type: 'module', moduleId: 'module_1' },
      ],
    },
  };
}
