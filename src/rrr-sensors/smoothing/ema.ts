const DEFAULT_ALPHA = 0.35;

export function smoothEma(
  previous: number | undefined,
  next: number | undefined,
  alpha = DEFAULT_ALPHA,
): number | undefined {
  if (!isFiniteNumber(next)) {
    return previous;
  }
  if (!isFiniteNumber(previous)) {
    return next;
  }

  const safeAlpha = clampAlpha(alpha);
  return previous + (next - previous) * safeAlpha;
}

export function clampAlpha(alpha: number): number {
  if (!Number.isFinite(alpha)) {
    return DEFAULT_ALPHA;
  }
  return Math.min(1, Math.max(0, alpha));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
