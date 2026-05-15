import { describe, expect, it } from 'vitest';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import type { RrrInteraction } from '@/rrr';
import { getRrrTourReadiness } from './readiness';

describe('getRrrTourReadiness', () => {
  it('ignores text-riddle stations', () => {
    const readiness = getRrrTourReadiness(buildValidDraft());

    expect(readiness).toEqual({
      modularStationCount: 0,
      issueCount: 0,
      stations: [],
    });
  });

  it('groups modular readiness issues by station', () => {
    const draft = buildValidDraft();
    draft.stations = [
      {
        ...buildValidStation('station-1', 1),
        riddleType: 'modular',
        interaction: {
          schemaVersion: 1,
          modules: [
            {
              id: 'gps_1',
              type: 'gps_enter',
              label: 'GPS prüfen',
              config: { lat: 46.5, lng: 11.3, radiusMeters: 1 },
            },
            {
              id: 'qr_1',
              type: 'qr_scan',
              label: 'QR prüfen',
              config: { expectedValue: '' },
            },
          ],
          condition: { type: 'module', moduleId: 'deleted_module' },
        },
      },
      {
        ...buildValidStation('station-2', 2),
        riddleType: 'modular',
        interaction: {
          schemaVersion: 1,
          modules: [
            {
              id: 'photo_1',
              type: 'photo_check_manual',
              label: 'Foto prüfen',
              config: { prompt: '', confirmLabel: 'Bestätigt' },
            },
          ],
          condition: { type: 'module', moduleId: 'photo_1' },
        },
      },
      buildValidStation('station-3', 3),
    ];

    const readiness = getRrrTourReadiness(draft);

    expect(readiness.modularStationCount).toBe(2);
    expect(readiness.stations.map((station) => station.stationId)).toEqual([
      'station-1',
      'station-2',
    ]);
    expect(readiness.stations[0].issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'gps_radius_small',
        'qr_scan_expected_value_empty',
        'missing_module_reference',
        'sensor_fallback_recommended',
      ]),
    );
    expect(readiness.stations[1].issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'photo_check_manual_prompt_empty',
        'sensor_fallback_recommended',
      ]),
    );
  });

  it('does not report fallback suggestions when fragile modules already have fallback metadata', () => {
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'gps_1',
          type: 'gps_enter',
          label: 'GPS prüfen',
          config: { lat: 46.5, lng: 11.3, radiusMeters: 20 },
          fallbackModuleId: 'code_1',
        },
        {
          id: 'code_1',
          type: 'code_word',
          label: 'Code',
          config: { code: 'north', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'gps_1' },
    };
    const draft = buildValidDraft();
    draft.stations = [
      {
        ...buildValidStation('station-1', 1),
        riddleType: 'modular',
        interaction,
      },
    ];

    const readiness = getRrrTourReadiness(draft);

    expect(readiness).toMatchObject({
      modularStationCount: 1,
      issueCount: 0,
      stations: [],
    });
  });
});
