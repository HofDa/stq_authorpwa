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
        attemptsByModuleId: {},
        timedOutModuleIds: [],
      },
      { type: 'reset' },
    );

    expect(session).toEqual(resetRrrRuntimeSession());
  });

  it('times out a configured sequence step and allows retry', () => {
    const interaction = sequenceInteraction({
      firstModuleTimeoutMs: 1000,
      firstModuleMaxAttempts: 2,
    });
    let session = createRrrRuntimeSession();

    const firstEvaluation = evaluateInteraction(
      interaction,
      { headingDegrees: 90, isStill: false },
      {},
      session,
      { nowMs: 0 },
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: firstEvaluation,
      nowMs: 0,
    });

    expect(firstEvaluation.modules.face_direction_1.status).toBe('running');
    expect(session.activeStepStartedAtMs).toBe(0);

    const timedOutEvaluation = evaluateInteraction(
      interaction,
      { headingDegrees: 90, isStill: false },
      {},
      session,
      { nowMs: 1001 },
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: timedOutEvaluation,
      nowMs: 1001,
    });

    expect(timedOutEvaluation.modules.face_direction_1.status).toBe('failed');
    expect(timedOutEvaluation.modules.face_direction_1.timeout).toMatchObject({
      timedOut: true,
      retryable: true,
      attempts: 1,
      maxAttempts: 2,
      timeoutMs: 1000,
    });
    expect(session.timedOutModuleIds).toContain('face_direction_1');
    expect(session.attemptsByModuleId.face_direction_1).toBe(1);
    expect(session.status).toBe('failed');

    session = reduceRrrRuntimeSession(session, {
      type: 'retry',
      moduleId: 'face_direction_1',
      nowMs: 1200,
    });

    expect(session.status).toBe('running');
    expect(session.timedOutModuleIds).not.toContain('face_direction_1');
    expect(session.activeStepStartedAtMs).toBe(1200);
  });

  it('resets timer_wait elapsed time on session reset', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'timer_wait_1',
          type: 'timer_wait',
          label: 'Wait',
          config: { durationMs: 3000 },
        },
      ],
      condition: { type: 'module', moduleId: 'timer_wait_1' },
    };
    let session = createRrrRuntimeSession();

    const firstEvaluation = evaluateInteraction(
      interaction,
      {},
      {},
      session,
      { nowMs: 1000 },
    );
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: firstEvaluation,
      nowMs: 1000,
    });

    expect(session.activeStepStartedAtMs).toBe(1000);

    const completed = evaluateInteraction(interaction, {}, {}, session, {
      nowMs: 4000,
    });
    expect(completed.modules.timer_wait_1.status).toBe('success');

    session = reduceRrrRuntimeSession(session, { type: 'reset' });
    const restarted = evaluateInteraction(interaction, {}, {}, session, {
      nowMs: 5000,
    });
    session = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result: restarted,
      nowMs: 5000,
    });

    expect(restarted.modules.timer_wait_1.status).toBe('running');
    expect(session.activeStepStartedAtMs).toBe(5000);
    expect(
      evaluateInteraction(interaction, {}, {}, session, {
        nowMs: 7999,
      }).modules.timer_wait_1.status,
    ).toBe('running');
    expect(
      evaluateInteraction(interaction, {}, {}, session, {
        nowMs: 8000,
      }).modules.timer_wait_1.status,
    ).toBe('success');
  });
});

function sequenceInteraction(
  options: {
    firstModuleTimeoutMs?: number;
    firstModuleMaxAttempts?: number;
  } = {},
): RrrInteraction {
  return {
    schemaVersion: 1,
    modules: [
      {
        id: 'face_direction_1',
        type: 'compass_align',
        label: 'Face direction',
        config: { targetDegrees: 0, tolerance: 10 },
        timeoutMs: options.firstModuleTimeoutMs,
        retry:
          options.firstModuleMaxAttempts === undefined
            ? undefined
            : { maxAttempts: options.firstModuleMaxAttempts },
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
