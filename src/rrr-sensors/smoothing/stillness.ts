export interface StillnessDebounceOptions {
  stillAfterMs?: number;
  releaseAfterMs?: number;
}

export interface StillnessDebounceState {
  isStill: boolean;
  stableSince?: number;
  movingSince?: number;
  lastMovementAt?: number;
}

const DEFAULT_STILL_AFTER_MS = 1500;
const DEFAULT_RELEASE_AFTER_MS = 250;

export function updateStillnessDebounce(
  previous: StillnessDebounceState | undefined,
  moving: boolean,
  timestamp: number,
  options: StillnessDebounceOptions = {},
): StillnessDebounceState {
  const stillAfterMs = options.stillAfterMs ?? DEFAULT_STILL_AFTER_MS;
  const releaseAfterMs = options.releaseAfterMs ?? DEFAULT_RELEASE_AFTER_MS;

  if (moving) {
    const movingSince = previous?.movingSince ?? timestamp;
    const staysStill =
      Boolean(previous?.isStill) && timestamp - movingSince < releaseAfterMs;
    return {
      isStill: staysStill,
      movingSince,
      stableSince: undefined,
      lastMovementAt: timestamp,
    };
  }

  const stableSince = previous?.stableSince ?? timestamp;
  return {
    isStill: Boolean(previous?.isStill) || timestamp - stableSince >= stillAfterMs,
    stableSince,
    movingSince: undefined,
    lastMovementAt: previous?.lastMovementAt,
  };
}
