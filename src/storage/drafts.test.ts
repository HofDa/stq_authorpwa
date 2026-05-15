import JSZip from 'jszip';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildDraftExportZip } from '@/export/tourExport';
import { db, type StoredBlob } from './db';
import { deleteDraft, duplicateDraft, getDraft } from './drafts';
import { buildValidDraft } from '@/test/fixtures';

async function seedBlob(id: string, draftId: string, body = 'fake-bytes') {
  const blob: StoredBlob = {
    id,
    draftId,
    mime: 'image/webp',
    blob: new Blob([body], { type: 'image/webp' }),
    createdAt: 1_700_000_000_000,
  };
  await db.blobs.put(blob);
}

async function seedDraftWithReferencedBlobs() {
  const draft = buildValidDraft();
  draft.tour.imagePath = `images/${draft.tour.coverBlobId}.webp`;
  draft.stations[0].imagePath = `images/${draft.stations[0].imageBlobId}.webp`;
  const historyImage = draft.stations[0].en.historySection.find(
    (block) => block.type === 'image',
  );
  if (!historyImage || historyImage.type !== 'image' || !historyImage.localBlobId) {
    throw new Error('Expected fixture to include a history image block.');
  }
  historyImage.imagePath = `images/${historyImage.localBlobId}.webp`;

  await db.drafts.put(draft);
  await seedBlob('blob-cover', draft.draftId, 'cover-bytes');
  await seedBlob('blob-station-hero', draft.draftId, 'station-bytes');
  await seedBlob('blob-station-body', draft.draftId, 'body-bytes');

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

afterAll(() => {
  db.close();
});

describe('duplicateDraft', () => {
  it('migrates legacy solution fields into acceptedAnswers when loading a draft', async () => {
    const legacyDraft = buildValidDraft() as unknown as Record<string, unknown>;
    const legacyStation = (
      legacyDraft.stations as Array<Record<string, unknown>>
    )[0];
    delete legacyStation.acceptedAnswers;
    legacyStation.solution = 'tower';
    (legacyStation.de as Record<string, unknown>).solution = 'turm';
    (legacyStation.it as Record<string, unknown>).solution = 'torre';

    await db.drafts.put(legacyDraft as never);

    const loaded = await getDraft('bolzano-classic');

    expect(loaded?.stations[0].acceptedAnswers.en).toEqual(['tower']);
    expect(loaded?.stations[0].acceptedAnswers.de).toEqual(['turm']);
    expect(loaded?.stations[0].acceptedAnswers.it).toEqual(['torre']);
  });

  it('copies the cover image blob into the duplicated draft ownership', async () => {
    const original = await seedDraftWithReferencedBlobs();

    const duplicate = await duplicateDraft(original.draftId);

    expect(duplicate).toBeTruthy();
    expect(duplicate?.tour.coverBlobId).toBeDefined();
    expect(duplicate?.tour.coverBlobId).not.toBe(original.tour.coverBlobId);

    const copied = await db.blobs.get(duplicate!.tour.coverBlobId!);
    expect(copied).toBeTruthy();
    expect(copied?.draftId).toBe(duplicate?.draftId);
    expect(copied?.mime).toBe('image/webp');
    expect(copied?.createdAt).toBe(1_700_000_000_000);
    expect(await copied?.blob.text()).toBe('cover-bytes');
  });

  it('copies station image blobs and rewrites blob ids in the duplicated draft', async () => {
    const original = await seedDraftWithReferencedBlobs();

    const duplicate = await duplicateDraft(original.draftId);

    expect(duplicate).toBeTruthy();
    expect(duplicate?.stations[0].imageBlobId).toBeDefined();
    expect(duplicate?.stations[0].imageBlobId).not.toBe(
      original.stations[0].imageBlobId,
    );

    const originalHistoryImage = original.stations[0].en.historySection.find(
      (block) => block.type === 'image',
    );
    const duplicateHistoryImage = duplicate?.stations[0].en.historySection.find(
      (block) => block.type === 'image',
    );

    expect(originalHistoryImage && originalHistoryImage.type === 'image').toBe(true);
    expect(duplicateHistoryImage && duplicateHistoryImage.type === 'image').toBe(
      true,
    );
    expect(duplicateHistoryImage?.localBlobId).toBeDefined();
    expect(duplicateHistoryImage?.localBlobId).not.toBe(
      originalHistoryImage && originalHistoryImage.type === 'image'
        ? originalHistoryImage.localBlobId
        : undefined,
    );
    expect(duplicate?.tour.coverBlobId).not.toBe(original.tour.coverBlobId);
    expect(duplicate?.tour.imagePath).toBe(`images/${duplicate?.tour.coverBlobId}.webp`);
    expect(duplicate?.stations[0].imagePath).toBe(
      `images/${duplicate?.stations[0].imageBlobId}.webp`,
    );
    expect(duplicateHistoryImage?.imagePath).toBe(
      `images/${duplicateHistoryImage?.localBlobId}.webp`,
    );

    const copiedStationBlob = await db.blobs.get(duplicate!.stations[0].imageBlobId!);
    expect(copiedStationBlob?.draftId).toBe(duplicate?.draftId);
    expect(await copiedStationBlob?.blob.text()).toBe('station-bytes');
  });

  it('deleting the original draft does not delete blobs used by the duplicate', async () => {
    const original = await seedDraftWithReferencedBlobs();
    const duplicate = await duplicateDraft(original.draftId);
    expect(duplicate).toBeTruthy();

    await deleteDraft(original.draftId);

    expect(await db.drafts.get(original.draftId)).toBeUndefined();
    expect(await db.blobs.where('draftId').equals(original.draftId).count()).toBe(0);
    expect(await db.blobs.where('draftId').equals(duplicate!.draftId).count()).toBe(3);
    expect(await db.blobs.get(duplicate!.tour.coverBlobId!)).toBeTruthy();
    expect(await db.blobs.get(duplicate!.stations[0].imageBlobId!)).toBeTruthy();
    const duplicateHistoryImage = duplicate!.stations[0].en.historySection.find(
      (block) => block.type === 'image',
    );
    expect(duplicateHistoryImage?.localBlobId).toBeDefined();
    expect(await db.blobs.get(duplicateHistoryImage!.localBlobId!)).toBeTruthy();
  });

  it('exports the duplicate with all referenced images after deleting the original', async () => {
    const original = await seedDraftWithReferencedBlobs();
    const duplicate = await duplicateDraft(original.draftId);
    expect(duplicate).toBeTruthy();

    await deleteDraft(original.draftId);

    const result = await buildDraftExportZip(duplicate!);

    expect(result.missingBlobIds).toEqual([]);
    expect(result.validationErrors).toEqual([]);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(
      zip.file(`${duplicate!.tour.id}/images/${duplicate!.tour.coverBlobId}.webp`),
    ).toBeTruthy();
    expect(
      zip.file(
        `${duplicate!.tour.id}/images/${duplicate!.stations[0].imageBlobId}.webp`,
      ),
    ).toBeTruthy();
    const duplicateHistoryImage = duplicate!.stations[0].en.historySection.find(
      (block) => block.type === 'image',
    );
    expect(
      zip.file(
        `${duplicate!.tour.id}/images/${duplicateHistoryImage?.localBlobId}.webp`,
      ),
    ).toBeTruthy();
  });
});
