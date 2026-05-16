export interface RrrFeedbackPulse {
  durationMs: number;
  gapMs?: number;
  frequencyHz?: number;
  volume?: number;
  hapticMs?: number;
}

export type RrrFeedbackPattern = readonly RrrFeedbackPulse[];

export const RRR_FEEDBACK_PATTERNS = {
  success: [
    { durationMs: 70, gapMs: 45, frequencyHz: 660, volume: 0.06, hapticMs: 45 },
    { durationMs: 120, frequencyHz: 880, volume: 0.07, hapticMs: 70 },
  ],
  error: [
    { durationMs: 120, gapMs: 55, frequencyHz: 180, volume: 0.08, hapticMs: 80 },
    { durationMs: 120, frequencyHz: 140, volume: 0.08, hapticMs: 80 },
  ],
  tap: [{ durationMs: 45, frequencyHz: 520, volume: 0.045, hapticMs: 35 }],
  knock: [
    { durationMs: 55, gapMs: 65, frequencyHz: 150, volume: 0.07, hapticMs: 55 },
    { durationMs: 55, frequencyHz: 150, volume: 0.07, hapticMs: 55 },
  ],
  morseDot: [{ durationMs: 90, frequencyHz: 620, volume: 0.055, hapticMs: 70 }],
  morseDash: [{ durationMs: 270, frequencyHz: 620, volume: 0.055, hapticMs: 180 }],
} as const satisfies Record<string, RrrFeedbackPattern>;

const MORSE_UNITS = {
  dotMs: 90,
  dashMs: 270,
  symbolGapMs: 90,
  letterGapMs: 270,
  wordGapMs: 630,
} as const;

const MORSE_CODE: Record<string, string> = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
};

export function buildMorseFeedbackPattern(value: string): RrrFeedbackPattern {
  const pulses: RrrFeedbackPulse[] = [];
  const words = value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);

  words.forEach((word, wordIndex) => {
    const letters = [...word]
      .map((letter) => MORSE_CODE[letter])
      .filter((code): code is string => Boolean(code));

    letters.forEach((code, letterIndex) => {
      [...code].forEach((symbol, symbolIndex) => {
        pulses.push({
          durationMs: symbol === '-' ? MORSE_UNITS.dashMs : MORSE_UNITS.dotMs,
          gapMs:
            symbolIndex === code.length - 1
              ? undefined
              : MORSE_UNITS.symbolGapMs,
          frequencyHz: 620,
          volume: 0.055,
          hapticMs: symbol === '-' ? 180 : 70,
        });
      });

      if (letterIndex < letters.length - 1 && pulses.length > 0) {
        addGapToLastPulse(pulses, MORSE_UNITS.letterGapMs);
      }
    });

    if (wordIndex < words.length - 1 && pulses.length > 0) {
      addGapToLastPulse(pulses, MORSE_UNITS.wordGapMs);
    }
  });

  return pulses;
}

export function buildMorseSymbolFeedbackPattern(
  value: string,
): RrrFeedbackPattern {
  return normalizeMorseSymbolPattern(value).split('').map((symbol, index, symbols) => ({
    durationMs: symbol === '-' ? MORSE_UNITS.dashMs : MORSE_UNITS.dotMs,
    gapMs: index === symbols.length - 1 ? undefined : MORSE_UNITS.symbolGapMs,
    frequencyHz: 620,
    volume: 0.055,
    hapticMs: symbol === '-' ? 180 : 70,
  }));
}

export function normalizeMorseSymbolPattern(value: string): string {
  return value
    .replace(/[·•]/g, '.')
    .replace(/[–—_]/g, '-')
    .replace(/[^.-]/g, '');
}

export function buildKnockFeedbackPattern(
  groups: readonly number[],
): RrrFeedbackPattern {
  const pulses: RrrFeedbackPulse[] = [];

  groups
    .map((group) => Math.max(0, Math.floor(group)))
    .filter((group) => group > 0)
    .forEach((group, groupIndex, normalizedGroups) => {
      for (let index = 0; index < group; index += 1) {
        pulses.push({
          durationMs: 55,
          gapMs: index === group - 1 ? undefined : 80,
          frequencyHz: 150,
          volume: 0.07,
          hapticMs: 55,
        });
      }

      if (groupIndex < normalizedGroups.length - 1 && pulses.length > 0) {
        addGapToLastPulse(pulses, 260);
      }
    });

  return pulses;
}

function addGapToLastPulse(pulses: RrrFeedbackPulse[], gapMs: number) {
  const last = pulses[pulses.length - 1];
  if (!last) return;
  last.gapMs = (last.gapMs ?? 0) + gapMs;
}
