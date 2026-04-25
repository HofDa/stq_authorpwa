import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ExportRiddleEntrySchema,
  TourEntrySchema,
  type TourDraft,
} from '@/schema';
import { db, type StoredBlob } from '@/storage/db';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { buildDraftExportZip } from './tourExport';

async function seedBlob(id: string, draftId: string, body = 'fake-bytes') {
  const blob: StoredBlob = {
    id,
    draftId,
    mime: 'image/webp',
    blob: new Blob([body], { type: 'image/webp' }),
    createdAt: 0,
  };
  await db.blobs.put(blob);
}

async function draftWithAllBlobs(): Promise<TourDraft> {
  const draft = buildValidDraft();
  await seedBlob('blob-cover', draft.draftId);
  await seedBlob('blob-station-hero', draft.draftId);
  await seedBlob('blob-station-body', draft.draftId);
  return draft;
}

beforeEach(async () => {
  await db.blobs.clear();
  await db.drafts.clear();
});

afterEach(async () => {
  await db.blobs.clear();
  await db.drafts.clear();
});

describe('buildDraftExportZip', () => {
  it('produces tours.json and riddles.json at expected paths', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    expect(result.missingBlobIds).toEqual([]);
    expect(result.validationErrors).toEqual([]);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(zip.file('tours.json')).toBeTruthy();
    expect(zip.file('bolzano-classic/riddles.json')).toBeTruthy();
    expect(zip.file('bolzano-classic/images/blob-cover.webp')).toBeTruthy();
    expect(zip.file('bolzano-classic/icons/station-1.png')).toBeTruthy();
    expect(zip.file('bolzano-classic/markers/station-1.png')).toBeTruthy();
    expect(
      zip.file('bolzano-classic/images/blob-station-hero.webp'),
    ).toBeTruthy();
    expect(
      zip.file('bolzano-classic/images/blob-station-body.webp'),
    ).toBeTruthy();
  });

  it('rewrites cover and station imagePaths to the ZIP-relative location', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);

    const toursJson = result.tourJson as Array<Record<string, unknown>>;
    expect(toursJson[0].imagePath).toBe(
      'bolzano-classic/images/blob-cover.webp',
    );

    const riddlesJson = result.riddlesJson as Array<Record<string, unknown>>;
    expect(riddlesJson[0].imagePath).toBe(
      'bolzano-classic/images/blob-station-hero.webp',
    );
    expect(riddlesJson[0].iconPath).toBe('bolzano-classic/icons/station-1.png');
    expect(riddlesJson[0].markerIconPath).toBe(
      'bolzano-classic/markers/station-1.png',
    );
  });

  it('rewrites image blocks inside content sections', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);
    const riddlesJson = result.riddlesJson as Array<Record<string, unknown>>;
    const history = (
      riddlesJson[0].en as { historySection: Array<Record<string, unknown>> }
    ).historySection;
    const imageBlock = history.find((b) => b.type === 'image');
    expect(imageBlock?.imagePath).toBe(
      'bolzano-classic/images/blob-station-body.webp',
    );
    // Authoring-only localBlobId must be stripped from the exported block.
    expect(imageBlock).not.toHaveProperty('localBlobId');
  });

  it('strips authoring-only blob id fields from the tour entry', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);
    const tour = (result.tourJson as Array<Record<string, unknown>>)[0];
    expect(tour).not.toHaveProperty('coverBlobId');
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station).not.toHaveProperty('imageBlobId');
    expect(station).not.toHaveProperty('iconKey');
    expect(station).not.toHaveProperty('iconColorKey');
  });

  it('produces JSON that re-parses through the Flutter-facing schemas', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);

    const tours = result.tourJson as unknown[];
    expect(tours).toHaveLength(1);
    expect(() => TourEntrySchema.parse(tours[0])).not.toThrow();

    const riddles = result.riddlesJson as unknown[];
    for (const riddle of riddles) {
      expect(() => ExportRiddleEntrySchema.parse(riddle)).not.toThrow();
    }
  });

  it('reports missing blobs without throwing', async () => {
    const draft = buildValidDraft();
    // Only seed the cover; station blobs are missing.
    await seedBlob('blob-cover', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.missingBlobIds.sort()).toEqual(
      ['blob-station-body', 'blob-station-hero'].sort(),
    );
    expect(result.validationWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          entityType: 'blob',
          path: 'stations.0.imageBlobId',
        }),
        expect.objectContaining({
          severity: 'warning',
          entityType: 'blob',
          path: 'stations.0.en.historySection.2.localBlobId',
        }),
      ]),
    );
    expect(result.validationErrors).toEqual([]);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(
      zip.file('bolzano-classic/images/blob-station-hero.webp'),
    ).toBeNull();

    // Missing blobs leave imagePath at its fallback (empty string in fixtures).
    const station = (
      result.riddlesJson as Array<Record<string, unknown>>
    )[0];
    expect(station.imagePath).toBe('');
  });

  it('surfaces validation errors for an invalid serialized tour', async () => {
    const draft = buildValidDraft();
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);
    // Corrupt the draft post-fixture — the schema allows this in authoring
    // (factories start at 0), but once users start editing we want the
    // export to catch obvious mistakes. Use a negative number, which the
    // schema explicitly rejects.
    draft.tour.number = -5;

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors[0].path).toContain('tour.number');
  });

  it('flags per-station errors with the station index in the path', async () => {
    const draft = buildValidDraft();
    draft.stations.push(buildValidStation('station-2', 2));
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);
    // Fourth hint is one too many for the schema's max(3).
    draft.stations[1].en.hints = ['a', 'b', 'c', 'd'];

    const result = await buildDraftExportZip(draft);

    expect(
      result.validationErrors.some((e) => e.path.startsWith('stations.1.')),
    ).toBe(true);
  });

  it('fails validation when tour.id is empty', async () => {
    const draft = buildValidDraft();
    draft.tour.id = '';
    draft.tour.riddlesPath = '';
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.id',
          message: 'Tour id is required for export.',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('fails validation when tour.id is not a safe slug', async () => {
    const draft = buildValidDraft();
    draft.tour.id = '../Bolzano Classic';
    draft.tour.riddlesPath = `${draft.tour.id}/riddles.json`;
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.id',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('fails validation when riddlesPath does not match the tour id', async () => {
    const draft = buildValidDraft();
    draft.tour.riddlesPath = 'other-tour/riddles.json';
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.riddlesPath',
          message: 'Riddles path must equal "bolzano-classic/riddles.json".',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('still exports a valid draft with a stable id and riddlesPath', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const toursJson = result.tourJson as Array<Record<string, unknown>>;
    expect(toursJson[0].id).toBe('bolzano-classic');
    expect(toursJson[0].riddlesPath).toBe('bolzano-classic/riddles.json');
  });

  it('serializes the English answer into the English locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.en as { solution: string }).solution).toBe('tower');
    expect(station).not.toHaveProperty('solution');
  });

  it('serializes the German answer into the German locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.de as { solution: string }).solution).toBe('turm');
  });

  it('serializes the Italian answer into the Italian locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.it as { solution: string }).solution).toBe('torre');
  });

  it('fails validation when a locale-specific accepted answer is missing', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0].acceptedAnswers.de = [];

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'stations.0.acceptedAnswers.de',
          message: 'Accepted answers for DE are required for export.',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
  });
});
