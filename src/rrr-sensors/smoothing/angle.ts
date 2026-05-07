import { clampAlpha } from './ema';

export function normalizeAngleDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function angleDeltaDegrees(left: number, right: number): number {
  const delta = Math.abs(normalizeAngleDegrees(left) - normalizeAngleDegrees(right));
  return Math.min(delta, 360 - delta);
}

export function signedAngleDeltaDegrees(from: number, to: number): number {
  return ((normalizeAngleDegrees(to) - normalizeAngleDegrees(from) + 540) % 360) - 180;
}

export function smoothAngleDegrees(
  previous: number | undefined,
  next: number | undefined,
  alpha = 0.35,
): number | undefined {
  if (!isFiniteNumber(next)) {
    return previous;
  }
  if (!isFiniteNumber(previous)) {
    return normalizeAngleDegrees(next);
  }

  const smoothed =
    normalizeAngleDegrees(previous) +
    signedAngleDeltaDegrees(previous, next) * clampAlpha(alpha);
  return normalizeAngleDegrees(smoothed);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
