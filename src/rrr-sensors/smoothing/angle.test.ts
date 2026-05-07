import { describe, expect, it } from 'vitest';
import {
  angleDeltaDegrees,
  normalizeAngleDegrees,
  smoothAngleDegrees,
} from './angle';

describe('angle smoothing', () => {
  it('normalizes angles into the 0-359 range', () => {
    expect(normalizeAngleDegrees(360)).toBe(0);
    expect(normalizeAngleDegrees(-1)).toBe(359);
    expect(normalizeAngleDegrees(721)).toBe(1);
  });

  it('measures the short path across the 359 to 0 wraparound', () => {
    expect(angleDeltaDegrees(359, 1)).toBe(2);
    expect(angleDeltaDegrees(10, 350)).toBe(20);
  });

  it('smooths heading across north without jumping through 180 degrees', () => {
    expect(smoothAngleDegrees(350, 10, 0.5)).toBe(0);
    expect(smoothAngleDegrees(10, 350, 0.5)).toBe(0);
  });
});
