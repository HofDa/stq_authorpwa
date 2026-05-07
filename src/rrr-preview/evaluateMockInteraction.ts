import type { RrrInteraction } from '@/rrr';
import { evaluateInteraction } from '@/rrr-runtime';
import type { RrrMockEvaluation, RrrMockInputs } from './types';

export function evaluateMockInteraction(
  interaction: RrrInteraction,
  inputs: RrrMockInputs,
): RrrMockEvaluation {
  return evaluateInteraction(
    interaction,
    {
      headingDegrees: inputs.headingDegrees,
      gpsLat: inputs.gpsLat,
      gpsLng: inputs.gpsLng,
      isStill: inputs.isStill,
    },
    {
      textAnswer: inputs.textAnswer,
    },
  );
}
