import { describe, expect, it, vi } from 'vitest';
import { RRR_FEEDBACK_PATTERNS } from '@/rrr/feedbackPatterns';
import { playSensoryFeedback } from './sensoryFeedback';

describe('playSensoryFeedback', () => {
  it('plays haptic vibration patterns from feedback pulses', () => {
    const vibrate = vi.fn(() => true);

    playSensoryFeedback(RRR_FEEDBACK_PATTERNS.success, {
      audio: false,
      vibrate,
    });

    expect(vibrate).toHaveBeenCalledWith([45, 45, 70]);
  });

  it('schedules audio tones without requiring haptics', () => {
    const setTimeout = vi.fn((handler: () => void) => {
      handler();
      return 1;
    });
    const oscillator = {
      frequency: { value: 0 },
      type: 'sine' as OscillatorType,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gain = {
      gain: {
        value: 0,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const context = {
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
    };

    playSensoryFeedback(RRR_FEEDBACK_PATTERNS.tap, {
      haptic: false,
      createAudioContext: () => context,
      setTimeout,
    });

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.value).toBe(520);
    expect(oscillator.start).toHaveBeenCalled();
    expect(oscillator.stop).toHaveBeenCalled();
  });
});
