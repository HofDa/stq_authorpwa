import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import { getDraft, saveDraft } from '@/storage';
import type { TourDraft } from '@/schema';

export type DraftLoadStatus = 'loading' | 'ready' | 'not_found' | 'error';

type LoadResult =
  | { kind: 'ready'; draft: TourDraft }
  | { kind: 'not_found' }
  | { kind: 'error'; error: Error };

/**
 * Returns a live draft by id plus an updater that persists partial changes.
 *
 * `update` accepts either a partial patch or a recipe function. It always
 * bumps `updatedAt` via `saveDraft`.
 *
 * `status` is an explicit state machine so callers never get stuck on
 * `undefined`: IndexedDB unavailability (Firefox Private Mode, Safari ITP)
 * and schema/parse errors surface as `error`, missing rows as `not_found`.
 */
export function useDraft(draftId: string | undefined) {
  const [reloadKey, setReloadKey] = useState(0);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  useEffect(() => {
    if (!draftId) return;
    console.info('[useDraft] load started', { tourId: draftId });
  }, [draftId, reloadKey]);

  const result = useLiveQuery<LoadResult | undefined>(
    async () => {
      if (!draftId) {
        return { kind: 'not_found' } satisfies LoadResult;
      }
      try {
        const next = await getDraft(draftId);
        if (!next) {
          console.warn('[useDraft] load: draft not found', { tourId: draftId });
          return { kind: 'not_found' } satisfies LoadResult;
        }
        console.info('[useDraft] load success', { tourId: draftId });
        return { kind: 'ready', draft: next } satisfies LoadResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[useDraft] load failed', { tourId: draftId, err });
        return { kind: 'error', error } satisfies LoadResult;
      }
    },
    [draftId, reloadKey],
  );

  const draft = result?.kind === 'ready' ? result.draft : undefined;
  const loadError =
    result?.kind === 'error' ? result.error : null;

  let status: DraftLoadStatus;
  if (!result) {
    status = 'loading';
  } else if (result.kind === 'ready') {
    status = 'ready';
  } else if (result.kind === 'not_found') {
    status = 'not_found';
  } else {
    status = 'error';
  }

  if (status === 'ready' && updateError) {
    status = 'error';
  }

  const update = useCallback(
    async (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => {
      if (!draftId) return;
      try {
        const current = await getDraft(draftId);
        if (!current) return;
        const next =
          typeof patch === 'function' ? patch(current) : { ...current, ...patch };
        await saveDraft(next);
        if (updateError) setUpdateError(null);
      } catch (err) {
        console.error('[useDraft] update failed', { tourId: draftId, err });
        setUpdateError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [draftId, updateError],
  );

  const reload = useCallback(() => {
    setUpdateError(null);
    setReloadKey((value) => value + 1);
  }, []);

  const error = loadError ?? updateError;

  return { draft, update, status, error, reload } as const;
}
