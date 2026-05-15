import { describe, expect, it } from 'vitest';
import type { RrrInteraction } from '@/rrr';
import type { RrrInteractionResult } from '@/rrr/runtime';
import {
  createRrrFieldTestReport,
  formatRrrFieldTestReportMarkdown,
} from './fieldTestReport';

describe('RRR field-test reports', () => {
  it('creates a readable local report without full GPS traces', () => {
    const report = createRrrFieldTestReport({
      station: { id: 'station-1', title: 'Piazza Walther' },
      interaction,
      result,
      finalResult: 'success',
      testedAt: new Date('2026-05-08T09:30:00.000Z'),
      sensors: {
        gps: 'available',
        orientation: 'available',
        gpsAccuracyMeters: 8.4,
      },
      notes: 'GPS stabilized after a few seconds.',
      issueTags: ['gps_ungenau', 'ersatzloesung_noetig'],
    });

    expect(report).toMatchObject({
      station: { id: 'station-1', title: 'Piazza Walther' },
      interactionVersion: 1,
      moduleTypes: ['gps_enter', 'qr_scan'],
      conditionType: 'sequence',
      testedAt: '2026-05-08T09:30:00.000Z',
      finalResult: 'success',
      sensors: {
        gps: 'available',
        orientation: 'available',
        gpsAccuracyMeters: 8.4,
      },
      notes: 'GPS stabilized after a few seconds.',
      issueTags: ['gps_ungenau', 'ersatzloesung_noetig'],
    });
    expect(report).not.toHaveProperty('gpsLat');
    expect(report).not.toHaveProperty('gpsLng');

    const markdown = formatRrrFieldTestReportMarkdown(report);
    expect(markdown).toContain('# RRR Field-Test Report');
    expect(markdown).toContain('Station: Piazza Walther');
    expect(markdown).toContain('Module types: gps_enter, qr_scan');
    expect(markdown).toContain('GPS accuracy: 8 m');
    expect(markdown).toContain('GPS ungenau, Ersatzlösung nötig');
    expect(markdown).toContain('warning: Baustein "QR" hat noch keinen erwarteten QR-Wert.');
    expect(markdown).toContain('GPS stabilized after a few seconds.');
    expect(markdown).not.toContain('46.4983');
    expect(markdown).not.toContain('11.3548');
  });
});

const interaction: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'gps',
      type: 'gps_enter',
      label: 'GPS',
      config: { lat: 46.4983, lng: 11.3548, radiusMeters: 20 },
    },
    {
      id: 'qr',
      type: 'qr_scan',
      label: 'QR',
      config: { expectedValue: '' },
    },
  ],
  condition: {
    type: 'sequence',
    steps: [
      { type: 'module', moduleId: 'gps' },
      { type: 'module', moduleId: 'qr' },
    ],
  },
};

const result: RrrInteractionResult = {
  status: 'success',
  condition: {
    status: 'success',
    message: 'Gelöst',
    condition: interaction.condition,
  },
  modules: {
    gps: {
      id: 'gps',
      label: 'GPS',
      type: 'gps_enter',
      status: 'success',
      message: 'Innerhalb des Radius',
    },
    qr: {
      id: 'qr',
      label: 'QR',
      type: 'qr_scan',
      status: 'success',
      message: 'QR gelesen',
    },
  },
};
