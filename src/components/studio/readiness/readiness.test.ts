import { describe, expect, it } from 'vitest';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { getStationReadiness } from './stationReadiness';
import { getTourReadiness, getReadyStationCount } from './tourReadiness';
import { getExportReadiness, isReadyToExport } from './exportReadiness';
import { getWorstStatus } from './readinessTypes';

describe('getStationReadiness', () => {
  it('flags missing GPS, story and success when locale content is empty', () => {
    const station = buildValidStation();
    station.position_lat = 0;
    station.position_lng = 0;
    station.en = {
      location: '',
      firstSection: [],
      historySection: [],
      riddleSection: [],
      successSection: [],
      hints: [],
    };
    station.acceptedAnswers.en = [];

    const checks = getStationReadiness(station, 'en');
    const byId = Object.fromEntries(checks.map((c) => [c.id, c]));
    expect(byId[`${station.id}.gps`].status).toBe('missing');
    expect(byId[`${station.id}.title`].status).toBe('missing');
    expect(byId[`${station.id}.story`].status).toBe('missing');
    expect(byId[`${station.id}.success`].status).toBe('missing');
    expect(byId[`${station.id}.riddle`].status).toBe('missing');
  });

  it('marks a station with riddle text but no answer as a problem', () => {
    const station = buildValidStation();
    station.acceptedAnswers.de = [];

    const riddleCheck = getStationReadiness(station, 'de').find(
      (c) => c.id === `${station.id}.riddle`,
    );
    expect(riddleCheck?.status).toBe('problem');
  });
});

describe('getTourReadiness', () => {
  it('reports missing tour title when blank', () => {
    const draft = buildValidDraft();
    draft.tour.de.title = '';

    const titleCheck = getTourReadiness(draft, 'de').find(
      (c) => c.id === 'tour.title',
    );
    expect(titleCheck?.status).toBe('missing');
  });
});

describe('getExportReadiness', () => {
  it('reports no blockers for a fully populated draft', () => {
    const draft = buildValidDraft();
    expect(getExportReadiness(draft, 'de')).toEqual([]);
    expect(isReadyToExport(draft, 'de')).toBe(true);
  });

  it('aggregates per-station GPS misses into a single blocker line', () => {
    const draft = buildValidDraft();
    const second = buildValidStation('station-2', 2);
    second.position_lat = 0;
    second.position_lng = 0;
    draft.stations.push(second);

    const blockers = getExportReadiness(draft, 'de');
    const gpsBlocker = blockers.find((c) => c.id === 'export.stations.gps');
    expect(gpsBlocker?.message).toContain('1 station');
    expect(isReadyToExport(draft, 'de')).toBe(false);
  });
});

describe('getReadyStationCount', () => {
  it('counts only stations whose checks are all ready', () => {
    const draft = buildValidDraft();
    const incomplete = buildValidStation('station-2', 2);
    incomplete.position_lat = 0;
    incomplete.position_lng = 0;
    draft.stations.push(incomplete);

    expect(getReadyStationCount(draft, 'de')).toEqual({ ready: 1, total: 2 });
  });
});

describe('getWorstStatus', () => {
  it('returns problem when any check is a problem', () => {
    expect(
      getWorstStatus([
        { id: 'a', label: 'a', status: 'ready' },
        { id: 'b', label: 'b', status: 'problem' },
      ]),
    ).toBe('problem');
  });

  it('returns ready when every check is ready', () => {
    expect(
      getWorstStatus([
        { id: 'a', label: 'a', status: 'ready' },
        { id: 'b', label: 'b', status: 'ready' },
      ]),
    ).toBe('ready');
  });
});
