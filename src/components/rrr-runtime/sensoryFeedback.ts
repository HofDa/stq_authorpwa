import type { RrrFeedbackPattern } from '@/rrr/feedbackPatterns';

type TimerFn = (handler: () => void, timeout?: number) => number;

interface SensoryFeedbackOptions {
  audio?: boolean;
  haptic?: boolean;
  volumeScale?: number;
  vibrate?: (pattern: number[]) => boolean;
  createAudioContext?: () => MinimalAudioContext | undefined;
  setTimeout?: TimerFn;
}

interface MinimalAudioContext {
  currentTime: number;
  destination: unknown;
  state?: string;
  resume?: () => Promise<void>;
  createOscillator: () => MinimalOscillatorNode;
  createGain: () => MinimalGainNode;
}

interface MinimalOscillatorNode {
  frequency: { value: number };
  type: OscillatorType;
  connect: (node: unknown) => void;
  start: (when?: number) => void;
  stop: (when?: number) => void;
}

interface MinimalGainNode {
  gain: {
    value: number;
    setValueAtTime?: (value: number, startTime: number) => void;
    exponentialRampToValueAtTime?: (value: number, endTime: number) => void;
  };
  connect: (node: unknown) => void;
}

export function playSensoryFeedback(
  pattern: RrrFeedbackPattern,
  options: SensoryFeedbackOptions = {},
) {
  if (pattern.length === 0) return;

  const audio = options.audio ?? true;
  const haptic = options.haptic ?? true;

  if (haptic) {
    playHapticPattern(pattern, options.vibrate);
  }

  if (audio) {
    playAudioPattern(pattern, options);
  }
}

function playHapticPattern(
  pattern: RrrFeedbackPattern,
  vibrate: SensoryFeedbackOptions['vibrate'],
) {
  const vibrateFn = vibrate ?? getNavigatorVibrate();
  if (!vibrateFn) return;

  const vibrationPattern = pattern.flatMap((pulse, index) => {
    const duration = Math.max(0, pulse.hapticMs ?? pulse.durationMs);
    const gap = Math.max(0, pulse.gapMs ?? 0);
    return index === pattern.length - 1 ? [duration] : [duration, gap];
  });

  try {
    vibrateFn(vibrationPattern);
  } catch {
    // Haptics are best-effort; unsupported browsers should not affect solving.
  }
}

function playAudioPattern(
  pattern: RrrFeedbackPattern,
  options: SensoryFeedbackOptions,
) {
  const createAudioContext = options.createAudioContext ?? getAudioContextFactory();
  const setTimer = options.setTimeout ?? windowSetTimeout;
  const context = createAudioContext?.();
  if (!context) return;

  if (context.state === 'suspended') {
    void context.resume?.();
  }

  let offsetMs = 0;
  for (const pulse of pattern) {
    const startMs = offsetMs;
    setTimer(() => playTone(context, pulse, options.volumeScale ?? 1), startMs);
    offsetMs += Math.max(0, pulse.durationMs) + Math.max(0, pulse.gapMs ?? 0);
  }
}

function playTone(
  context: MinimalAudioContext,
  pulse: RrrFeedbackPattern[number],
  volumeScale: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const durationSeconds = Math.max(0.01, pulse.durationMs / 1000);
  const startTime = context.currentTime;
  const endTime = startTime + durationSeconds;
  const volume = Math.max(0.001, Math.min(0.12, (pulse.volume ?? 0.05) * volumeScale));

  oscillator.type = 'sine';
  oscillator.frequency.value = pulse.frequencyHz ?? 440;
  gain.gain.value = volume;
  gain.gain.setValueAtTime?.(volume, startTime);
  gain.gain.exponentialRampToValueAtTime?.(0.001, endTime);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function getNavigatorVibrate() {
  if (typeof navigator === 'undefined') return undefined;
  return typeof navigator.vibrate === 'function'
    ? navigator.vibrate.bind(navigator)
    : undefined;
}

function getAudioContextFactory() {
  if (typeof window === 'undefined') return undefined;
  const AudioContextCtor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return AudioContextCtor
    ? () => new AudioContextCtor() as unknown as MinimalAudioContext
    : undefined;
}

const windowSetTimeout: TimerFn = (handler, timeout) => {
  if (typeof window === 'undefined') return 0;
  return window.setTimeout(handler, timeout);
};
