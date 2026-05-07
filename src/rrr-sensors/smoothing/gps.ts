import { recommendGpsRadius } from '../gpsQuality';
import { smoothEma } from './ema';

export interface GpsSmoothingOptions {
  alpha?: number;
  maxAccuracyMeters?: number;
}

export interface GpsSample {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface SmoothedGpsSample {
  sample: GpsSample;
  accepted: boolean;
  ignoredReason?: 'missing_coordinates' | 'poor_accuracy';
  recommendedRadiusMeters: number;
}

const DEFAULT_MAX_ACCURACY_METERS = 80;

export function smoothGpsSample(
  previous: GpsSample | undefined,
  next: GpsSample,
  options: GpsSmoothingOptions = {},
): SmoothedGpsSample {
  const recommendedRadiusMeters = recommendGpsRadius(next.accuracy);
  if (!isFiniteNumber(next.latitude) || !isFiniteNumber(next.longitude)) {
    return {
      sample: previous ?? {},
      accepted: false,
      ignoredReason: 'missing_coordinates',
      recommendedRadiusMeters,
    };
  }

  const maxAccuracyMeters =
    options.maxAccuracyMeters ?? DEFAULT_MAX_ACCURACY_METERS;
  if (
    isFiniteNumber(next.accuracy) &&
    next.accuracy > maxAccuracyMeters &&
    previous?.latitude !== undefined &&
    previous.longitude !== undefined
  ) {
    return {
      sample: previous,
      accepted: false,
      ignoredReason: 'poor_accuracy',
      recommendedRadiusMeters,
    };
  }

  return {
    sample: {
      latitude: smoothEma(previous?.latitude, next.latitude, options.alpha),
      longitude: smoothEma(previous?.longitude, next.longitude, options.alpha),
      accuracy: smoothEma(previous?.accuracy, next.accuracy, options.alpha),
    },
    accepted: true,
    recommendedRadiusMeters,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
