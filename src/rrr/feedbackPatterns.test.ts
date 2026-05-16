import { describe, expect, it } from 'vitest';
import {
  buildKnockFeedbackPattern,
  buildMorseFeedbackPattern,
  buildMorseSymbolFeedbackPattern,
  normalizeMorseSymbolPattern,
  RRR_FEEDBACK_PATTERNS,
} from './feedbackPatterns';

describe('feedbackPatterns', () => {
  it('exposes short default cues for module feedback states', () => {
    expect(RRR_FEEDBACK_PATTERNS.success.length).toBeGreaterThan(0);
    expect(RRR_FEEDBACK_PATTERNS.error.length).toBeGreaterThan(0);
    expect(RRR_FEEDBACK_PATTERNS.success[0].frequencyHz).toBeGreaterThan(
      RRR_FEEDBACK_PATTERNS.error[0].frequencyHz ?? 0,
    );
  });

  it('builds morse pulse patterns from text', () => {
    const pattern = buildMorseFeedbackPattern('s o');

    expect(pattern.map((pulse) => pulse.durationMs)).toEqual([
      90,
      90,
      90,
      270,
      270,
      270,
    ]);
    expect(pattern[2].gapMs).toBe(630);
  });

  it('builds grouped knock-code patterns', () => {
    const pattern = buildKnockFeedbackPattern([2, 3]);

    expect(pattern).toHaveLength(5);
    expect(pattern[0].gapMs).toBe(80);
    expect(pattern[1].gapMs).toBe(260);
    expect(pattern[4].gapMs).toBeUndefined();
  });

  it('normalizes and builds explicit morse symbol patterns', () => {
    expect(normalizeMorseSymbolPattern('· - x •')).toBe('.-.');
    expect(
      buildMorseSymbolFeedbackPattern('·-').map((pulse) => pulse.durationMs),
    ).toEqual([90, 270]);
  });
});
