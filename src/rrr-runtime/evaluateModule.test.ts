import { describe, expect, it } from 'vitest';
import type { RrrModule } from '@/rrr';
import {
  evaluateModule,
  getDirectionHotColdFeedback,
  getProximityHintFeedback,
} from './evaluateModule';
import type { RrrRuntimeEvaluationInput } from './types';

const baseInput: RrrRuntimeEvaluationInput = {
  mockState: {},
  userInput: {},
};

describe('evaluateModule', () => {
  it('evaluates text_answer modules', () => {
    const module = textModule({ answer: 'tower', caseSensitive: false });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { textAnswer: 'Tower' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { textAnswer: 'gate' },
      }).status,
    ).toBe('failed');
  });

  it('evaluates compass_align modules', () => {
    const module = moduleWithConfig('compass_align', {
      targetDegrees: 0,
      tolerance: 10,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { headingDegrees: 355 },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { headingDegrees: 45 },
      }).status,
    ).toBe('running');
  });

  it('evaluates direction_hotcold modules with proximity feedback', () => {
    const module = moduleWithConfig('direction_hotcold', {
      targetDegrees: 0,
      successTolerance: 10,
    });

    const correct = evaluateModule(module, {
      ...baseInput,
      mockState: { headingDegrees: 355 },
    });
    const warm = evaluateModule(module, {
      ...baseInput,
      mockState: { headingDegrees: 45 },
    });
    const veryCold = evaluateModule(module, {
      ...baseInput,
      mockState: { headingDegrees: 180 },
    });

    expect(correct.status).toBe('success');
    expect(correct.directionHotCold?.proximity).toBe('correct');
    expect(correct.directionHotCold?.deltaDegrees).toBe(5);
    expect(warm.status).toBe('running');
    expect(warm.directionHotCold?.proximity).toBe('warm');
    expect(veryCold.status).toBe('running');
    expect(veryCold.directionHotCold?.proximity).toBe('very_cold');
  });

  it('derives direction_hotcold proximity outside React', () => {
    expect(
      getDirectionHotColdFeedback({
        headingDegrees: 20,
        targetDegrees: 0,
        successTolerance: 10,
      }).proximity,
    ).toBe('very_warm');
    expect(
      getDirectionHotColdFeedback({
        headingDegrees: 110,
        targetDegrees: 0,
        successTolerance: 10,
      }).proximity,
    ).toBe('cold');
  });

  it('evaluates hold_still modules', () => {
    const module = moduleWithConfig('hold_still', { durationMs: 3000 });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { isStill: true },
      }).status,
    ).toBe('success');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('evaluates gps_enter modules', () => {
    const module = moduleWithConfig('gps_enter', {
      lat: 46.4983,
      lng: 11.3548,
      radiusMeters: 25,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { gpsLat: 46.4983, gpsLng: 11.3548 },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        mockState: { gpsLat: 46.5, gpsLng: 11.36 },
      }).status,
    ).toBe('running');
  });

  it('evaluates proximity_hint modules with GPS proximity feedback', () => {
    const module = moduleWithConfig('proximity_hint', {
      lat: 46.4983,
      lng: 11.3548,
      successRadiusMeters: 25,
    });

    const inside = evaluateModule(module, {
      ...baseInput,
      mockState: { gpsLat: 46.4983, gpsLng: 11.3548 },
    });
    const near = evaluateModule(module, {
      ...baseInput,
      mockState: { gpsLat: 46.499, gpsLng: 11.3548 },
    });
    const far = evaluateModule(module, {
      ...baseInput,
      mockState: { gpsLat: 46.55, gpsLng: 11.4 },
    });

    expect(inside.status).toBe('success');
    expect(inside.proximityHint?.proximity).toBe('inside_target_radius');
    expect(near.status).toBe('running');
    expect(near.proximityHint?.proximity).toBe('near');
    expect(far.status).toBe('running');
    expect(far.proximityHint?.proximity).toBe('far');
  });

  it('derives proximity_hint state outside React', () => {
    expect(
      getProximityHintFeedback({
        currentLat: 46.4983,
        currentLng: 11.3548,
        targetLat: 46.4983,
        targetLng: 11.3548,
        successRadiusMeters: 20,
      }).proximity,
    ).toBe('inside_target_radius');
    expect(
      getProximityHintFeedback({
        currentLat: 46.5,
        currentLng: 11.3548,
        targetLat: 46.4983,
        targetLng: 11.3548,
        successRadiusMeters: 20,
      }).proximity,
    ).toBe('getting_closer');
  });

  it('evaluates qr_scan modules from manual user input', () => {
    const module = moduleWithConfig('qr_scan', {
      expectedValue: 'station-3-gate',
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { qrScanValue: 'station-3-gate' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { qrScanValue: 'wrong-code' },
      }).status,
    ).toBe('failed');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('evaluates multi_choice modules from selected option indexes', () => {
    const module = moduleWithConfig('multi_choice', {
      question: 'Welche Farben siehst du?',
      options: ['Rot', 'Blau', 'Grün'],
      correctOptionIndexes: [0, 2],
      allowMultiple: true,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: {
          multiChoiceSelectionsByModuleId: { multi_choice_1: [2, 0] },
        },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: {
          multiChoiceSelectionsByModuleId: { multi_choice_1: [0] },
        },
      }).status,
    ).toBe('failed');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('keeps multi_choice modules running when options are empty', () => {
    const module = moduleWithConfig('multi_choice', {
      question: 'Welche Farben siehst du?',
      options: ['', ''],
      correctOptionIndexes: [],
    });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: {
        multiChoiceSelectionsByModuleId: { multi_choice_1: [0] },
      },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch keine Antwortoptionen festgelegt');
  });

  it('keeps qr_scan modules running when expectedValue is empty', () => {
    const module = moduleWithConfig('qr_scan', { expectedValue: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { qrScanValue: 'station-3-gate' },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch kein erwarteter QR-Wert festgelegt');
  });

  it('evaluates code_word modules from manual user input', () => {
    const module = moduleWithConfig('code_word', {
      code: 'Adler',
      caseSensitive: false,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { codeWordValue: 'adler' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { codeWordValue: 'falke' },
      }).status,
    ).toBe('failed');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('respects code_word caseSensitive config', () => {
    const module = moduleWithConfig('code_word', {
      code: 'Adler',
      caseSensitive: true,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { codeWordValue: 'Adler' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { codeWordValue: 'adler' },
      }).status,
    ).toBe('failed');
  });

  it('keeps code_word modules running when code is empty', () => {
    const module = moduleWithConfig('code_word', { code: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { codeWordValue: 'adler' },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch kein Codewort festgelegt');
  });

  it('evaluates morse_code modules from dot and dash input', () => {
    const module = moduleWithConfig('morse_code', {
      pattern: '.- --',
      shortAudioUrl: 'short.mp3',
      longAudioUrl: 'long.mp3',
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { morseCodeValue: '.---' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { morseCodeValue: '.-.' },
      }).status,
    ).toBe('failed');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('keeps morse_code modules running when pattern is empty', () => {
    const module = moduleWithConfig('morse_code', { pattern: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { morseCodeValue: '.-' },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch kein Morsecode festgelegt');
  });

  it('evaluates sequential_code modules from final code input', () => {
    const module = moduleWithConfig('sequential_code', {
      code: 'A1B2',
      hint: 'Collected from plaques',
      caseSensitive: false,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { sequentialCodeValue: 'a1b2' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { sequentialCodeValue: 'x9' },
      }).status,
    ).toBe('failed');
    expect(evaluateModule(module, baseInput).status).toBe('running');
  });

  it('respects sequential_code caseSensitive config', () => {
    const module = moduleWithConfig('sequential_code', {
      code: 'A1B2',
      caseSensitive: true,
    });

    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { sequentialCodeValue: 'A1B2' },
      }).status,
    ).toBe('success');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { sequentialCodeValue: 'a1b2' },
      }).status,
    ).toBe('failed');
  });

  it('keeps sequential_code modules running when code is empty', () => {
    const module = moduleWithConfig('sequential_code', { code: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { sequentialCodeValue: 'A1B2' },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch kein gesammelter Code festgelegt');
  });

  it('evaluates timer_wait modules against session elapsed time', () => {
    const module = moduleWithConfig('timer_wait', { durationMs: 3000 });

    expect(
      evaluateModule(module, {
        ...baseInput,
        session: { ...runtimeSession, activeStepStartedAtMs: 1000 },
        activeModuleId: 'timer_wait_1',
        nowMs: 2500,
      }).status,
    ).toBe('running');
    expect(
      evaluateModule(module, {
        ...baseInput,
        session: { ...runtimeSession, activeStepStartedAtMs: 1000 },
        activeModuleId: 'timer_wait_1',
        nowMs: 4000,
      }).status,
    ).toBe('success');
  });

  it('keeps timer_wait modules running when durationMs is missing', () => {
    const module = moduleWithConfig('timer_wait', {});

    const result = evaluateModule(module, {
      ...baseInput,
      session: { ...runtimeSession, activeStepStartedAtMs: 1000 },
      activeModuleId: 'timer_wait_1',
      nowMs: 4000,
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch keine Wartezeit festgelegt');
  });

  it('evaluates object_found modules from manual confirmation input', () => {
    const module = moduleWithConfig('object_found', {
      prompt: 'Finde den roten Marker',
      confirmLabel: 'Marker gefunden',
    });

    expect(evaluateModule(module, baseInput).status).toBe('running');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { objectFoundModuleIds: ['object_found_1'] },
      }).status,
    ).toBe('success');
  });

  it('keeps object_found modules running when prompt is empty', () => {
    const module = moduleWithConfig('object_found', { prompt: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { objectFoundModuleIds: ['object_found_1'] },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch keine Fund-Bestätigung festgelegt');
  });

  it('evaluates photo_check_manual modules from manual confirmation input', () => {
    const module = moduleWithConfig('photo_check_manual', {
      prompt: 'Vergleiche dein Foto mit dem Schild',
      confirmLabel: 'Foto passt',
    });

    expect(evaluateModule(module, baseInput).status).toBe('running');
    expect(
      evaluateModule(module, {
        ...baseInput,
        userInput: { photoCheckManualModuleIds: ['photo_check_manual_1'] },
      }).status,
    ).toBe('success');
  });

  it('keeps photo_check_manual modules running when prompt is empty', () => {
    const module = moduleWithConfig('photo_check_manual', { prompt: '' });

    const result = evaluateModule(module, {
      ...baseInput,
      userInput: { photoCheckManualModuleIds: ['photo_check_manual_1'] },
    });

    expect(result.status).toBe('running');
    expect(result.message).toBe('Noch keine Foto-Aufgabe festgelegt');
  });
});

const runtimeSession = {
  completedModuleIds: [],
  activeSequenceIndex: 0,
  status: 'running' as const,
  attemptsByModuleId: {},
  timedOutModuleIds: [],
};

function textModule(config: Record<string, unknown>): RrrModule {
  return {
    id: 'module_1',
    type: 'text_answer',
    label: 'Text answer',
    config,
  };
}

function moduleWithConfig(
  type: Exclude<RrrModule['type'], 'text_answer'>,
  config: Record<string, unknown>,
): RrrModule {
  return {
    id: `${type}_1`,
    type,
    label: type,
    config,
  };
}
