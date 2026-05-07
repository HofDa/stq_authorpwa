import type { RrrModule } from '@/rrr';
import type {
  RrrModuleResult,
  RrrRuntimeEvaluationInput,
  RrrRuntimeStatus,
} from './types';

export function evaluateModule(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  switch (module.type) {
    case 'text_answer':
      return evaluateTextAnswer(module, input);
    case 'compass_align':
      return evaluateCompassAlign(module, input);
    case 'hold_still':
      return evaluateHoldStill(module, input);
    case 'gps_enter':
      return evaluateGpsEnter(module, input);
  }
}

function evaluateTextAnswer(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const expected = readString(module.config.answer);
  const actual = input.userInput.textAnswer ?? '';
  const caseSensitive = Boolean(module.config.caseSensitive);

  if (!expected.trim()) {
    return moduleResult(module, 'running', 'No expected answer configured');
  }
  if (!actual.trim()) {
    return moduleResult(module, 'running', 'Waiting for answer');
  }

  const matches = caseSensitive
    ? actual === expected
    : actual.trim().toLowerCase() === expected.trim().toLowerCase();

  return moduleResult(
    module,
    matches ? 'success' : 'failed',
    matches ? 'Answer matches' : 'Answer does not match',
  );
}

function evaluateCompassAlign(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const headingDegrees = input.mockState.headingDegrees;
  if (!isFiniteNumber(headingDegrees)) {
    return moduleResult(module, 'running', 'Waiting for heading');
  }

  const targetDegrees = normalizeDegrees(readNumber(module.config.targetDegrees));
  const tolerance = Math.max(0, readNumber(module.config.tolerance));
  const delta = headingDelta(headingDegrees, targetDegrees);
  const aligned = delta <= tolerance;

  return moduleResult(
    module,
    aligned ? 'success' : 'running',
    aligned
      ? `Aligned within ${tolerance} degrees`
      : `${Math.round(delta)} degrees from target`,
  );
}

function evaluateHoldStill(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  return moduleResult(
    module,
    input.mockState.isStill ? 'success' : 'running',
    input.mockState.isStill ? 'Stillness active' : 'Waiting for stillness',
  );
}

function evaluateGpsEnter(
  module: RrrModule,
  input: RrrRuntimeEvaluationInput,
): RrrModuleResult {
  const { gpsLat, gpsLng } = input.mockState;
  if (!isFiniteNumber(gpsLat) || !isFiniteNumber(gpsLng)) {
    return moduleResult(module, 'running', 'Waiting for GPS position');
  }

  const targetLat = readNumber(module.config.lat);
  const targetLng = readNumber(module.config.lng);
  const radiusMeters = Math.max(0, readNumber(module.config.radiusMeters));
  const distance = distanceMeters(gpsLat, gpsLng, targetLat, targetLng);
  const inside = distance <= radiusMeters;

  return moduleResult(
    module,
    inside ? 'success' : 'running',
    inside
      ? `Inside ${radiusMeters} m radius`
      : `${Math.round(distance)} m from target`,
  );
}

function moduleResult(
  module: RrrModule,
  status: RrrRuntimeStatus,
  message: string,
): RrrModuleResult {
  return {
    id: module.id,
    label: module.label,
    type: module.type,
    status,
    message,
  };
}

function headingDelta(a: number, b: number): number {
  const delta = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(delta, 360 - delta);
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function distanceMeters(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const earthRadiusMeters = 6371000;
  const latDelta = toRadians(latB - latA);
  const lngDelta = toRadians(lngB - lngA);
  const startLat = toRadians(latA);
  const endLat = toRadians(latB);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  return (
    2 *
    earthRadiusMeters *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
