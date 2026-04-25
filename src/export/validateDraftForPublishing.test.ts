import { describe, expect, it } from 'vitest';
import { buildValidDraft } from '@/test/fixtures';
import { validateDraftForPublishing } from './validateDraftForPublishing';

describe('validateDraftForPublishing', () => {
  it('fails when tour.id is empty', () => {
    const draft = buildValidDraft();
    draft.tour.id = '';
    draft.tour.riddlesPath = '';

    const result = validateDraftForPublishing(draft);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'tour',
          path: 'tour.id',
          message: 'Tour id is required for publishing.',
        }),
      ]),
    );
  });

  it('fails when tour.id is not a safe slug', () => {
    const draft = buildValidDraft();
    draft.tour.id = '../Bolzano Classic';
    draft.tour.riddlesPath = `${draft.tour.id}/riddles.json`;

    const result = validateDraftForPublishing(draft);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'tour',
          path: 'tour.id',
        }),
      ]),
    );
  });

  it('fails when no stations exist', () => {
    const draft = buildValidDraft();
    draft.stations = [];

    const result = validateDraftForPublishing(draft);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'tour',
          path: 'stations',
          message: 'Add at least one station before publishing.',
        }),
      ]),
    );
  });

  it('fails when a station still uses placeholder coordinates', () => {
    const draft = buildValidDraft();
    draft.stations[0].position_lat = 0;
    draft.stations[0].position_lng = 0;

    const result = validateDraftForPublishing(draft);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'station',
          stationId: 'station-1',
          path: 'stations.0.position_lat',
        }),
      ]),
    );
  });

  it('fails when a locale-specific accepted answer is missing', () => {
    const draft = buildValidDraft();
    draft.stations[0].acceptedAnswers.de = [];

    const result = validateDraftForPublishing(draft);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'station',
          stationId: 'station-1',
          path: 'stations.0.acceptedAnswers.de',
          message: 'Accepted answers for DE are required for publishing.',
        }),
      ]),
    );
  });

  it('fails when required localized content is missing in the selected publish locale', () => {
    const draft = buildValidDraft();
    draft.stations[0].de.historySection = [];

    const result = validateDraftForPublishing(draft, { locale: 'de' });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'error',
          entityType: 'station',
          stationId: 'station-1',
          path: 'stations.0.de.historySection',
          message: 'Add history content for station 1 in DE.',
        }),
      ]),
    );
  });

  it('passes a valid draft without publish issues', () => {
    const draft = buildValidDraft();

    const result = validateDraftForPublishing(draft, { locale: 'it' });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
