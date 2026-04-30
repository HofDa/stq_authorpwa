import { describe, expect, it } from 'vitest';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { buildMockSuggestions, pickActionableChecks } from './mockSuggestions';
import { getStationReadiness } from '../readiness';

describe('buildMockSuggestions', () => {
  it('is deterministic for the same input', () => {
    const draft = buildValidDraft();
    draft.tour.de.title = '';
    const a = buildMockSuggestions('plan', { draft, locale: 'de' });
    const b = buildMockSuggestions('plan', { draft, locale: 'de' });
    expect(a.map((s) => s.id)).toEqual(b.map((s) => s.id));
  });

  it('caps suggestions at the requested limit', () => {
    const draft = buildValidDraft();
    draft.tour.de.title = '';
    draft.tour.de.duration = '';
    const second = buildValidStation('station-2', 2);
    second.position_lat = 0;
    second.position_lng = 0;
    draft.stations.push(second);

    const result = buildMockSuggestions('plan', {
      draft,
      locale: 'de',
      limit: 1,
    });
    expect(result).toHaveLength(1);
  });

  it('omits dismissed suggestion ids', () => {
    const draft = buildValidDraft();
    draft.tour.de.title = '';
    const initial = buildMockSuggestions('plan', { draft, locale: 'de' });
    expect(initial.some((s) => s.id === 'mock.plan.title')).toBe(true);

    const filtered = buildMockSuggestions('plan', {
      draft,
      locale: 'de',
      dismissed: new Set(['mock.plan.title']),
    });
    expect(filtered.some((s) => s.id === 'mock.plan.title')).toBe(false);
  });

  it('produces a station GPS suggestion when GPS is missing', () => {
    const draft = buildValidDraft();
    draft.stations[0].position_lat = 0;
    draft.stations[0].position_lng = 0;

    const suggestions = buildMockSuggestions('stations', {
      draft,
      locale: 'de',
    });
    expect(
      suggestions.some((s) => s.id === `mock.station.${draft.stations[0].id}.gps`),
    ).toBe(true);
  });

  it('produces a smoke-test suggestion for a fully ready preview', () => {
    const draft = buildValidDraft();
    const suggestions = buildMockSuggestions('preview', {
      draft,
      locale: 'de',
    });
    expect(suggestions.some((s) => s.id === 'mock.preview.smoke')).toBe(true);
  });

  it('produces a record-route suggestion when no GPS track exists', () => {
    const draft = buildValidDraft();
    draft.recordedRoute = [];
    const suggestions = buildMockSuggestions('route', { draft, locale: 'de' });
    expect(suggestions.some((s) => s.id === 'mock.route.record')).toBe(true);
  });
});

describe('pickActionableChecks', () => {
  it('keeps only missing/problem checks', () => {
    const station = buildValidStation();
    station.position_lat = 0;
    station.position_lng = 0;
    const checks = getStationReadiness(station, 'de');
    const actionable = pickActionableChecks(checks);
    expect(actionable.every((c) => c.status === 'missing' || c.status === 'problem')).toBe(
      true,
    );
    expect(actionable.length).toBeGreaterThan(0);
  });
});
