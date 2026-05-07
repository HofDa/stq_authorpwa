export type GpsQuality = 'good' | 'ok' | 'poor' | 'unknown';

const GOOD_ACCURACY_METERS = 8;
const OK_ACCURACY_METERS = 20;
const DEFAULT_RADIUS_METERS = 20;
const MIN_GOOD_RADIUS_METERS = 10;
const MIN_OK_RADIUS_METERS = 20;
const RADIUS_SAFETY_FACTOR = 1.5;

export function getGpsQuality(accuracyMeters?: number): GpsQuality {
  if (!isFinitePositiveNumber(accuracyMeters)) {
    return 'unknown';
  }

  if (accuracyMeters <= GOOD_ACCURACY_METERS) {
    return 'good';
  }

  if (accuracyMeters <= OK_ACCURACY_METERS) {
    return 'ok';
  }

  return 'poor';
}

export function recommendGpsRadius(accuracyMeters?: number): number {
  const quality = getGpsQuality(accuracyMeters);
  if (quality === 'unknown') {
    return DEFAULT_RADIUS_METERS;
  }

  const safeRadius = Math.ceil((accuracyMeters ?? 0) * RADIUS_SAFETY_FACTOR);
  if (quality === 'good') {
    return Math.max(MIN_GOOD_RADIUS_METERS, safeRadius);
  }

  if (quality === 'ok') {
    return Math.max(MIN_OK_RADIUS_METERS, safeRadius);
  }

  return safeRadius;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
