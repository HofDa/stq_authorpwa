import {
  createRrrRuntimeSession,
  evaluateInteraction,
  reduceRrrRuntimeSession,
  resetRrrRuntimeSession,
} from '@/rrr-core';
import type { RrrRuntimeUserInput } from '@/rrr-core';
import {
  angleDeltaDegrees,
  smoothAngleDegrees,
  smoothEma,
  smoothGpsSample,
  updateStillnessDebounce,
  type StillnessDebounceState,
  type RrrSensorState,
} from '@/rrr-sensors';
import type {
  RrrRuntimeBridge,
  RrrRuntimeBridgeListener,
  RrrRuntimeBridgeOptions,
  RrrRuntimeBridgeSmoothingOptions,
  RrrRuntimeBridgeSnapshot,
  RrrRuntimeBridgeStillnessOptions,
  RrrRuntimeBridgeStillnessState,
} from './types';

const DEFAULT_EVALUATION_INTERVAL_MS = 250;
const DEFAULT_STILLNESS_THRESHOLD_MS = 1500;
const DEFAULT_HEADING_MOVEMENT_THRESHOLD_DEGREES = 6;
const DEFAULT_TILT_MOVEMENT_THRESHOLD_DEGREES = 4;

type MotionSnapshot = {
  heading?: number;
  tiltX?: number;
  tiltY?: number;
  initialized: boolean;
  debounce?: StillnessDebounceState;
};

type SmoothingResult = {
  sensorState: RrrSensorState;
  metadata: RrrRuntimeBridgeSnapshot['smoothing'];
};

export function createRrrRuntimeBridge({
  interaction,
  adapters,
  userInput: initialUserInput = {},
  evaluationIntervalMs = DEFAULT_EVALUATION_INTERVAL_MS,
  stillness,
  smoothing,
  now = Date.now,
}: RrrRuntimeBridgeOptions): RrrRuntimeBridge {
  let rawSensorState = mergeSensorStates(
    { timestamp: now() },
    ...adapters.map((adapter) => adapter.getState()),
  );
  let smoothed = applySensorSmoothing(rawSensorState, undefined, smoothing);
  let userInput: RrrRuntimeUserInput = { ...initialUserInput };
  let session = createRrrRuntimeSession();
  let started = false;
  let disposed = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let motion: MotionSnapshot = { initialized: false };
  const listeners = new Set<RrrRuntimeBridgeListener>();

  function buildSnapshot(): RrrRuntimeBridgeSnapshot {
    const currentTime = now();
    const sensorState = smoothed.sensorState;
    const stillnessState = deriveStillness(sensorState, motion, stillness, currentTime);
    motion = stillnessState.motion;
    const mockState = {
      headingDegrees: sensorState.heading,
      gpsLat: sensorState.latitude,
      gpsLng: sensorState.longitude,
      isStill: stillnessState.state.isStill,
    };
    const result = evaluateInteraction(interaction, mockState, userInput, session, {
      nowMs: currentTime,
    });
    const nextSession = reduceRrrRuntimeSession(session, {
      type: 'evaluation',
      result,
      nowMs: currentTime,
    });
    session = sessionsEqual(session, nextSession) ? session : nextSession;

    return {
      interaction,
      rawSensorState,
      sensorState,
      smoothing: smoothed.metadata,
      mockState,
      userInput,
      result: evaluateInteraction(interaction, mockState, userInput, session, {
        nowMs: currentTime,
      }),
      session,
      stillness: stillnessState.state,
      started,
    };
  }

  let snapshot = buildSnapshot();

  function emit() {
    snapshot = buildSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  }

  const adapterUnsubscribers = adapters.map((adapter) =>
    adapter.subscribe((nextState) => {
      updateSensorState(nextState);
      emit();
    }),
  );

  function updateSensorState(nextState: RrrSensorState) {
    rawSensorState = mergeSensorStates(rawSensorState, nextState);
    smoothed = applySensorSmoothing(
      rawSensorState,
      smoothed.sensorState,
      smoothing,
    );
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async start() {
      if (disposed || started) {
        return;
      }
      started = true;
      emit();
      await Promise.all(adapters.map((adapter) => adapter.start()));
      updateSensorState(
        mergeSensorStates(
          rawSensorState,
          ...adapters.map((adapter) => adapter.getState()),
        ),
      );
      emit();
      if (evaluationIntervalMs > 0 && intervalId === null) {
        intervalId = setInterval(() => emit(), evaluationIntervalMs);
      }
    },
    stop() {
      if (!started) {
        return;
      }
      adapters.forEach((adapter) => adapter.stop());
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      started = false;
      emit();
    },
    reset() {
      session = resetRrrRuntimeSession();
      motion = { initialized: false };
      smoothed = applySensorSmoothing(rawSensorState, undefined, smoothing);
      emit();
    },
    retry(moduleId, options) {
      session = reduceRrrRuntimeSession(session, {
        type: 'retry',
        moduleId,
        resetProgress: options?.resetProgress,
        nowMs: now(),
      });
      motion = { initialized: false };
      emit();
    },
    setUserInput(nextUserInput) {
      userInput = { ...nextUserInput };
      emit();
    },
    dispose() {
      if (disposed) {
        return;
      }
      adapterUnsubscribers.forEach((unsubscribe) => unsubscribe());
      adapters.forEach((adapter) => adapter.stop());
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      listeners.clear();
      disposed = true;
      started = false;
    },
  };
}

function deriveStillness(
  state: RrrSensorState,
  previous: MotionSnapshot,
  options: RrrRuntimeBridgeStillnessOptions | undefined,
  currentTime: number,
): { state: RrrRuntimeBridgeStillnessState; motion: MotionSnapshot } {
  if (typeof state.isStill === 'boolean') {
    return {
      state: {
        isStill: state.isStill,
        lastMovementAt: previous.debounce?.lastMovementAt,
        source: 'adapter',
      },
      motion: previous,
    };
  }

  const hasOrientationValues =
    isFiniteNumber(state.heading) ||
    isFiniteNumber(state.tiltX) ||
    isFiniteNumber(state.tiltY);

  if (state.orientationStatus !== 'available' || !hasOrientationValues) {
    return {
      state: {
        isStill: false,
        lastMovementAt: previous.debounce?.lastMovementAt,
        source: 'unavailable',
      },
      motion: previous,
    };
  }

  if (!previous.initialized) {
    const debounce = updateStillnessDebounce(undefined, true, currentTime, {
      stillAfterMs: options?.thresholdMs ?? DEFAULT_STILLNESS_THRESHOLD_MS,
      releaseAfterMs: options?.releaseMs,
    });
    return {
      state: {
        isStill: false,
        lastMovementAt: debounce.lastMovementAt,
        source: 'derived',
      },
      motion: {
        heading: state.heading,
        tiltX: state.tiltX,
        tiltY: state.tiltY,
        initialized: true,
        debounce,
      },
    };
  }

  const headingThreshold =
    options?.headingMovementThresholdDegrees ??
    DEFAULT_HEADING_MOVEMENT_THRESHOLD_DEGREES;
  const tiltThreshold =
    options?.tiltMovementThresholdDegrees ??
    DEFAULT_TILT_MOVEMENT_THRESHOLD_DEGREES;
  const thresholdMs = options?.thresholdMs ?? DEFAULT_STILLNESS_THRESHOLD_MS;
  const moved =
    angleDeltaDegrees(previous.heading ?? 0, state.heading ?? previous.heading ?? 0) >
      headingThreshold ||
    numberDistance(previous.tiltX, state.tiltX) > tiltThreshold ||
    numberDistance(previous.tiltY, state.tiltY) > tiltThreshold;
  const debounce = updateStillnessDebounce(previous.debounce, moved, currentTime, {
    stillAfterMs: thresholdMs,
    releaseAfterMs: options?.releaseMs,
  });

  return {
    state: {
      isStill: debounce.isStill,
      lastMovementAt: debounce.lastMovementAt,
      source: 'derived',
    },
    motion: {
      heading: state.heading,
      tiltX: state.tiltX,
      tiltY: state.tiltY,
      initialized: true,
      debounce,
    },
  };
}

function applySensorSmoothing(
  rawState: RrrSensorState,
  previous: RrrSensorState | undefined,
  options: RrrRuntimeBridgeSmoothingOptions | undefined,
): SmoothingResult {
  if (options?.enabled === false) {
    return {
      sensorState: rawState,
      metadata: {
        enabled: false,
        gpsAccepted: true,
      },
    };
  }

  const gps = smoothGpsSample(previous, rawState, {
    alpha: options?.gpsAlpha,
    maxAccuracyMeters: options?.maxGpsAccuracyMeters,
  });
  const sensorState: RrrSensorState = {
    ...rawState,
    heading: smoothAngleDegrees(previous?.heading, rawState.heading, options?.headingAlpha),
    tiltX: smoothEma(previous?.tiltX, rawState.tiltX, options?.tiltAlpha),
    tiltY: smoothEma(previous?.tiltY, rawState.tiltY, options?.tiltAlpha),
    latitude: gps.sample.latitude,
    longitude: gps.sample.longitude,
    accuracy: gps.sample.accuracy,
  };

  return {
    sensorState,
    metadata: {
      enabled: true,
      gpsAccepted: gps.accepted,
      gpsIgnoredReason: gps.ignoredReason,
      recommendedGpsRadiusMeters: gps.recommendedRadiusMeters,
    },
  };
}

function mergeSensorStates(
  baseState: RrrSensorState,
  ...states: RrrSensorState[]
): RrrSensorState {
  return states.reduce<RrrSensorState>(
    (merged, state) => ({
      ...merged,
      ...state,
      error: state.error ?? merged.error,
      timestamp: Math.max(merged.timestamp, state.timestamp),
    }),
    baseState,
  );
}

function sessionsEqual(
  left: RrrRuntimeBridgeSnapshot['session'],
  right: RrrRuntimeBridgeSnapshot['session'],
): boolean {
  return (
    left.status === right.status &&
    left.activeSequenceIndex === right.activeSequenceIndex &&
    left.completedModuleIds.length === right.completedModuleIds.length &&
    left.completedModuleIds.every((id, index) => id === right.completedModuleIds[index])
  );
}

function numberDistance(
  left: number | undefined,
  right: number | undefined,
): number {
  if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
    return 0;
  }
  return Math.abs(left - right);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
