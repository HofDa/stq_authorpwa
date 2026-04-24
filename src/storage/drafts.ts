import { db } from './db';
import { emptyDraft, createId, type TourDraft } from '@/schema';

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
  const original = await db.drafts.get(draftId);
  if (!original) return undefined;
  const newId = createId('tour');
  const now = Date.now();
  const copy: TourDraft = {
    ...normalizeDraft(original),
    draftId: newId,
    createdAt: now,
    updatedAt: now,
    tour: {
      ...original.tour,
      id: newId,
      riddlesPath: `${newId}/riddles.json`,
      en: { ...original.tour.en, title: `${original.tour.en.title} (copy)` },
      de: { ...original.tour.de, title: `${original.tour.de.title} (Kopie)` },
      it: { ...original.tour.it, title: `${original.tour.it.title} (copia)` },
    },
  };
  await db.drafts.put(copy);
  return copy;
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
    recordedRoute: draft.recordedRoute ?? [],
  };
}
