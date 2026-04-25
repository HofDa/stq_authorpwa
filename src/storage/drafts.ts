import { db } from './db';
import {
  LOCALES,
  RiddleEntrySchema,
  emptyDraft,
  createId,
  type ContentBlock,
  type RiddleEntry,
  type RiddleLocaleContent,
  type TourDraft,
  type TourLocaleContent,
} from '@/schema';
import { ensureStationVisualDefaults } from '@/stations/visuals';

export async function listDrafts(): Promise<TourDraft[]> {
  return (await db.drafts.orderBy('updatedAt').reverse().toArray()).map(
    normalizeDraft,
  );
}

export async function getDraft(draftId: string): Promise<TourDraft | undefined> {
  const draft = await db.drafts.get(draftId);
  return draft ? normalizeDraft(draft) : undefined;
}

export async function createDraft(): Promise<TourDraft> {
  const draft = emptyDraft();
  await db.drafts.put(draft);
  return draft;
}

export async function saveDraft(draft: TourDraft): Promise<void> {
  await db.drafts.put(normalizeDraft({ ...draft, updatedAt: Date.now() }));
}

export async function duplicateDraft(draftId: string): Promise<TourDraft | undefined> {
  return db.transaction('rw', db.drafts, db.blobs, async () => {
    const original = await db.drafts.get(draftId);
    if (!original) return undefined;

    const normalized = normalizeDraft(original);
    const newId = createId('tour');
    const now = Date.now();
    const blobIdMap = await duplicateReferencedBlobs(
      collectReferencedBlobIds(normalized),
      newId,
    );
    const rewritten = rewriteDraftBlobIds(normalized, blobIdMap);

    const copy: TourDraft = {
      ...rewritten,
      draftId: newId,
      createdAt: now,
      updatedAt: now,
      tour: {
        ...rewritten.tour,
        id: newId,
        riddlesPath: `${newId}/riddles.json`,
        en: { ...rewritten.tour.en, title: `${rewritten.tour.en.title} (copy)` },
        de: { ...rewritten.tour.de, title: `${rewritten.tour.de.title} (Kopie)` },
        it: { ...rewritten.tour.it, title: `${rewritten.tour.it.title} (copia)` },
      },
    };

    await db.drafts.put(copy);
    return copy;
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  await db.transaction('rw', db.drafts, db.blobs, async () => {
    await db.drafts.delete(draftId);
    await db.blobs.where('draftId').equals(draftId).delete();
  });
}

function normalizeDraft(draft: TourDraft): TourDraft {
  return {
    ...draft,
    stations: draft.stations.map((station) =>
      ensureStationVisualDefaults(RiddleEntrySchema.parse(station)),
    ),
    recordedRoute: draft.recordedRoute ?? [],
    storyline: draft.storyline ?? { markdown: '', updatedAt: 0, chat: [] },
  };
}

function collectReferencedBlobIds(draft: TourDraft): string[] {
  const ids = new Set<string>();

  if (draft.tour.coverBlobId) {
    ids.add(draft.tour.coverBlobId);
  }

  for (const station of draft.stations) {
    if (station.imageBlobId) {
      ids.add(station.imageBlobId);
    }
    for (const locale of LOCALES) {
      collectContentBlockBlobIds(station[locale].firstSection, ids);
      collectContentBlockBlobIds(station[locale].historySection, ids);
      collectContentBlockBlobIds(station[locale].riddleSection, ids);
      collectContentBlockBlobIds(station[locale].successSection, ids);
    }
  }

  for (const locale of LOCALES) {
    collectContentBlockBlobIds(draft.tour[locale].description, ids);
    collectContentBlockBlobIds(draft.tour[locale].introSection, ids);
    collectContentBlockBlobIds(draft.tour[locale].outroSection, ids);
  }

  return Array.from(ids);
}

function collectContentBlockBlobIds(blocks: ContentBlock[], ids: Set<string>) {
  for (const block of blocks) {
    if (block.type === 'image' && block.localBlobId) {
      ids.add(block.localBlobId);
    }
  }
}

async function duplicateReferencedBlobs(
  blobIds: string[],
  newDraftId: string,
): Promise<Map<string, string>> {
  const blobIdMap = new Map<string, string>();
  if (blobIds.length === 0) {
    return blobIdMap;
  }

  const stored = await db.blobs.where('id').anyOf(blobIds).toArray();
  const duplicates = stored.map((blob) => {
    const newBlobId = createId('img');
    blobIdMap.set(blob.id, newBlobId);
    return {
      ...blob,
      id: newBlobId,
      draftId: newDraftId,
    };
  });

  if (duplicates.length > 0) {
    await db.blobs.bulkPut(duplicates);
  }

  return blobIdMap;
}

function rewriteDraftBlobIds(
  draft: TourDraft,
  blobIdMap: ReadonlyMap<string, string>,
): TourDraft {
  const coverBlobId = rewriteBlobId(draft.tour.coverBlobId, blobIdMap);

  return {
    ...draft,
    tour: {
      ...draft.tour,
      coverBlobId,
      imagePath: rewriteBlobBackedImagePath(
        draft.tour.imagePath,
        draft.tour.coverBlobId,
        coverBlobId,
      ),
      en: rewriteTourLocaleBlobIds(draft.tour.en, blobIdMap),
      de: rewriteTourLocaleBlobIds(draft.tour.de, blobIdMap),
      it: rewriteTourLocaleBlobIds(draft.tour.it, blobIdMap),
    },
    stations: draft.stations.map((station) =>
      rewriteStationBlobIds(station, blobIdMap),
    ),
  };
}

function rewriteStationBlobIds(
  station: RiddleEntry,
  blobIdMap: ReadonlyMap<string, string>,
): RiddleEntry {
  const imageBlobId = rewriteBlobId(station.imageBlobId, blobIdMap);

  return {
    ...station,
    imageBlobId,
    imagePath: rewriteBlobBackedImagePath(
      station.imagePath,
      station.imageBlobId,
      imageBlobId,
    ),
    en: rewriteRiddleLocaleBlobIds(station.en, blobIdMap),
    de: rewriteRiddleLocaleBlobIds(station.de, blobIdMap),
    it: rewriteRiddleLocaleBlobIds(station.it, blobIdMap),
  };
}

function rewriteTourLocaleBlobIds(
  locale: TourLocaleContent,
  blobIdMap: ReadonlyMap<string, string>,
): TourLocaleContent {
  return {
    ...locale,
    description: rewriteContentBlockBlobIds(locale.description, blobIdMap),
    introSection: rewriteContentBlockBlobIds(locale.introSection, blobIdMap),
    outroSection: rewriteContentBlockBlobIds(locale.outroSection, blobIdMap),
  };
}

function rewriteRiddleLocaleBlobIds(
  locale: RiddleLocaleContent,
  blobIdMap: ReadonlyMap<string, string>,
): RiddleLocaleContent {
  return {
    ...locale,
    firstSection: rewriteContentBlockBlobIds(locale.firstSection, blobIdMap),
    historySection: rewriteContentBlockBlobIds(locale.historySection, blobIdMap),
    riddleSection: rewriteContentBlockBlobIds(locale.riddleSection, blobIdMap),
    successSection: rewriteContentBlockBlobIds(locale.successSection, blobIdMap),
  };
}

function rewriteContentBlockBlobIds(
  blocks: ContentBlock[],
  blobIdMap: ReadonlyMap<string, string>,
): ContentBlock[] {
  return blocks.map((block) => {
    if (block.type !== 'image' || !block.localBlobId) {
      return block;
    }

    const localBlobId = rewriteBlobId(block.localBlobId, blobIdMap);
    if (!localBlobId) {
      return block;
    }

    return {
      ...block,
      localBlobId,
      imagePath: rewriteBlobBackedImagePath(
        block.imagePath,
        block.localBlobId,
        localBlobId,
      ),
    };
  });
}

function rewriteBlobId(
  blobId: string | undefined,
  blobIdMap: ReadonlyMap<string, string>,
): string | undefined {
  return blobId ? (blobIdMap.get(blobId) ?? blobId) : undefined;
}

function rewriteBlobBackedImagePath(
  imagePath: string,
  previousBlobId: string | undefined,
  nextBlobId: string | undefined,
): string {
  if (!previousBlobId || !nextBlobId) {
    return imagePath;
  }

  const previousPath = blobImagePath(previousBlobId);
  return imagePath === previousPath ? blobImagePath(nextBlobId) : imagePath;
}

function blobImagePath(blobId: string): string {
  return `images/${blobId}.webp`;
}
