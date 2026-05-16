import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import { evaluateMockInteraction } from './evaluateMockInteraction';
import type { RrrMockInputs } from './types';

const baseInputs: RrrMockInputs = {
  headingDegrees: 0,
  gpsLat: 0,
  gpsLng: 0,
  isStill: false,
  textAnswer: '',
  qrScanValue: '',
  morseCodeValue: '',
  codeWordValue: '',
  sequentialCodeValue: '',
  multiChoiceSelectionsByModuleId: {},
  photoCheckManualModuleIds: [],
  objectFoundModuleIds: [],
};

describe('evaluateMockInteraction', () => {
  it('simulates a compass module', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'face_north_1',
          type: 'compass_align',
          label: 'Face north',
          config: { targetDegrees: 0, tolerance: 10 },
        },
      ],
      condition: { type: 'module', moduleId: 'face_north_1' },
    };

    const aligned = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 355,
    });
    const away = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 45,
    });

    expect(aligned.modules.face_north_1.status).toBe('success');
    expect(aligned.status).toBe('success');
    expect(away.modules.face_north_1.status).toBe('running');
    expect(away.status).toBe('running');
  });

  it('simulates a direction hot/cold module with heading changes', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'direction_hotcold_1',
          type: 'direction_hotcold',
          label: 'Direction hot/cold',
          config: { targetDegrees: 0, successTolerance: 10 },
        },
      ],
      condition: { type: 'module', moduleId: 'direction_hotcold_1' },
    };

    const warm = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 45,
    });
    const correct = evaluateMockInteraction(interaction, {
      ...baseInputs,
      headingDegrees: 355,
    });

    expect(warm.modules.direction_hotcold_1.status).toBe('running');
    expect(warm.modules.direction_hotcold_1.directionHotCold?.proximity).toBe(
      'warm',
    );
    expect(correct.modules.direction_hotcold_1.status).toBe('success');
    expect(
      correct.modules.direction_hotcold_1.directionHotCold?.proximity,
    ).toBe('correct');
    expect(correct.status).toBe('success');
  });

  it('simulates hold still', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 3000 },
        },
      ],
      condition: { type: 'module', moduleId: 'hold_still_1' },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        isStill: true,
      }).status,
    ).toBe('success');
  });

  it('simulates a proximity hint module with GPS movement', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'proximity_hint_1',
          type: 'proximity_hint',
          label: 'Proximity hint',
          config: { lat: 46.4983, lng: 11.3548, successRadiusMeters: 25 },
        },
      ],
      condition: { type: 'module', moduleId: 'proximity_hint_1' },
    };

    const far = evaluateMockInteraction(interaction, {
      ...baseInputs,
      gpsLat: 46.55,
      gpsLng: 11.4,
    });
    const inside = evaluateMockInteraction(interaction, {
      ...baseInputs,
      gpsLat: 46.4983,
      gpsLng: 11.3548,
    });

    expect(far.modules.proximity_hint_1.status).toBe('running');
    expect(far.modules.proximity_hint_1.proximityHint?.proximity).toBe('far');
    expect(inside.modules.proximity_hint_1.status).toBe('success');
    expect(inside.modules.proximity_hint_1.proximityHint?.proximity).toBe(
      'inside_target_radius',
    );
  });

  it('simulates a text answer module', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'module_1' },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'Tower',
      }).status,
    ).toBe('success');
  });

  it('simulates a QR scan module with manual input', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'qr_scan_1',
          type: 'qr_scan',
          label: 'QR scan',
          config: { expectedValue: 'station-3-gate' },
        },
      ],
      condition: { type: 'module', moduleId: 'qr_scan_1' },
    };

    const matching = evaluateMockInteraction(interaction, {
      ...baseInputs,
      qrScanValue: 'station-3-gate',
    });
    const wrong = evaluateMockInteraction(interaction, {
      ...baseInputs,
      qrScanValue: 'wrong-code',
    });

    expect(matching.modules.qr_scan_1.status).toBe('success');
    expect(matching.modules.qr_scan_1.message).toBe('QR-Wert passt');
    expect(matching.status).toBe('success');
    expect(wrong.modules.qr_scan_1.status).toBe('failed');
    expect(wrong.modules.qr_scan_1.message).toBe('QR-Wert passt nicht');
    expect(wrong.status).toBe('failed');
  });

  it('simulates a Morse code module with manual input', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'morse_code_1',
          type: 'morse_code',
          label: 'Morse code',
          config: {
            pattern: '.-',
            shortAudioUrl: 'short.mp3',
            longAudioUrl: 'long.mp3',
          },
        },
      ],
      condition: { type: 'module', moduleId: 'morse_code_1' },
    };

    const matching = evaluateMockInteraction(interaction, {
      ...baseInputs,
      morseCodeValue: '.-',
    });
    const wrong = evaluateMockInteraction(interaction, {
      ...baseInputs,
      morseCodeValue: '..',
    });

    expect(matching.modules.morse_code_1.status).toBe('success');
    expect(matching.modules.morse_code_1.message).toBe('Morsecode passt');
    expect(matching.status).toBe('success');
    expect(wrong.modules.morse_code_1.status).toBe('failed');
    expect(wrong.modules.morse_code_1.message).toBe('Morsecode passt nicht');
    expect(wrong.status).toBe('failed');
  });

  it('simulates a code word module with manual input', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'code_word_1',
          type: 'code_word',
          label: 'Code word',
          config: { code: 'Adler', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'code_word_1' },
    };

    const matching = evaluateMockInteraction(interaction, {
      ...baseInputs,
      codeWordValue: 'adler',
    });
    const wrong = evaluateMockInteraction(interaction, {
      ...baseInputs,
      codeWordValue: 'falke',
    });

    expect(matching.modules.code_word_1.status).toBe('success');
    expect(matching.modules.code_word_1.message).toBe('Codewort passt');
    expect(matching.status).toBe('success');
    expect(wrong.modules.code_word_1.status).toBe('failed');
    expect(wrong.modules.code_word_1.message).toBe('Codewort passt nicht');
    expect(wrong.status).toBe('failed');
  });

  it('simulates a sequential code module with final code input', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'sequential_code_1',
          type: 'sequential_code',
          label: 'Sequential code',
          config: { code: 'A1B2', hint: 'Collected symbols', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'sequential_code_1' },
    };

    const matching = evaluateMockInteraction(interaction, {
      ...baseInputs,
      sequentialCodeValue: 'a1b2',
    });
    const wrong = evaluateMockInteraction(interaction, {
      ...baseInputs,
      sequentialCodeValue: 'x9',
    });

    expect(matching.modules.sequential_code_1.status).toBe('success');
    expect(matching.modules.sequential_code_1.message).toBe(
      'Gesammelter Code passt',
    );
    expect(matching.status).toBe('success');
    expect(wrong.modules.sequential_code_1.status).toBe('failed');
    expect(wrong.modules.sequential_code_1.message).toBe(
      'Gesammelter Code passt nicht',
    );
    expect(wrong.status).toBe('failed');
  });

  it('simulates an object found module with manual confirmation', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'object_found_1',
          type: 'object_found',
          label: 'Object found',
          config: {
            prompt: 'Finde den roten Marker',
            confirmLabel: 'Marker gefunden',
          },
        },
      ],
      condition: { type: 'module', moduleId: 'object_found_1' },
    };

    const waiting = evaluateMockInteraction(interaction, baseInputs);
    const confirmed = evaluateMockInteraction(interaction, {
      ...baseInputs,
      objectFoundModuleIds: ['object_found_1'],
    });

    expect(waiting.modules.object_found_1.status).toBe('running');
    expect(waiting.modules.object_found_1.message).toBe('Warte auf Bestätigung');
    expect(confirmed.modules.object_found_1.status).toBe('success');
    expect(confirmed.modules.object_found_1.message).toBe('Fund bestätigt');
    expect(confirmed.status).toBe('success');
  });

  it('simulates a manual photo-check module with manual confirmation', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'photo_check_manual_1',
          type: 'photo_check_manual',
          label: 'Manual photo check',
          config: {
            prompt: 'Vergleiche dein Foto mit dem Schild',
            confirmLabel: 'Foto passt',
          },
        },
      ],
      condition: { type: 'module', moduleId: 'photo_check_manual_1' },
    };

    const waiting = evaluateMockInteraction(interaction, baseInputs);
    const confirmed = evaluateMockInteraction(interaction, {
      ...baseInputs,
      photoCheckManualModuleIds: ['photo_check_manual_1'],
    });

    expect(waiting.modules.photo_check_manual_1.status).toBe('running');
    expect(waiting.modules.photo_check_manual_1.message).toBe(
      'Warte auf Bestätigung',
    );
    expect(confirmed.modules.photo_check_manual_1.status).toBe('success');
    expect(confirmed.modules.photo_check_manual_1.message).toBe(
      'Foto-Aufgabe bestätigt',
    );
    expect(confirmed.status).toBe('success');
  });

  it('combines module statuses through all_of', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower' },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 3000 },
        },
      ],
      condition: {
        type: 'all_of',
        children: [
          { type: 'module', moduleId: 'module_1' },
          { type: 'module', moduleId: 'hold_still_1' },
        ],
      },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'tower',
        isStill: true,
      }).status,
    ).toBe('success');
    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'wrong',
        isStill: true,
      }).status,
    ).toBe('failed');
  });

  it('reads nested condition trees with sequence steps', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'module_1',
          type: 'text_answer',
          label: 'Answer',
          config: { answer: 'tower' },
        },
        {
          id: 'hold_still_1',
          type: 'hold_still',
          label: 'Hold still',
          config: { durationMs: 3000 },
        },
      ],
      condition: {
        type: 'sequence',
        steps: [
          { type: 'module', moduleId: 'module_1' },
          {
            type: 'all_of',
            children: [{ type: 'module', moduleId: 'hold_still_1' }],
          },
        ],
      },
    };

    expect(
      evaluateMockInteraction(interaction, {
        ...baseInputs,
        textAnswer: 'tower',
        isStill: true,
      }).status,
    ).toBe('running');
  });
});
