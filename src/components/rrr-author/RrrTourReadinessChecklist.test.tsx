import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RrrTourReadinessChecklist } from './RrrTourReadinessChecklist';

describe('RrrTourReadinessChecklist', () => {
  it('does not render for tours without modular stations', () => {
    const html = renderToStaticMarkup(
      <RrrTourReadinessChecklist
        readiness={{ modularStationCount: 0, issueCount: 0, stations: [] }}
      />,
    );

    expect(html).toBe('');
  });

  it('groups issues by station and exposes station jump actions', () => {
    const onSelectStation = vi.fn();
    const html = renderToStaticMarkup(
      <RrrTourReadinessChecklist
        readiness={{
          modularStationCount: 2,
          issueCount: 2,
          stations: [
            {
              stationId: 'station-1',
              stationNumber: 1,
              stationLabel: 'Piazza',
              issues: [
                {
                  code: 'sensor_fallback_recommended',
                  message: 'GPS braucht eine Ersatzlösung.',
                  moduleId: 'gps_1',
                },
              ],
            },
            {
              stationId: 'station-2',
              stationNumber: 2,
              stationLabel: 'Tor',
              issues: [
                {
                  code: 'qr_scan_expected_value_empty',
                  message: 'QR-Wert fehlt.',
                  moduleId: 'qr_1',
                },
              ],
            },
          ],
        }}
        onSelectStation={onSelectStation}
      />,
    );

    expect(html).toContain('RRR-Feldtest-Check');
    expect(html).toContain('Sensorlastige Bausteine');
    expect(html).toContain('QR-Bausteine haben erwartete Werte');
    expect(html).toContain('Station 1');
    expect(html).toContain('Piazza');
    expect(html).toContain('GPS braucht eine Ersatzlösung.');
    expect(html).toContain('Öffnen');
  });
});
