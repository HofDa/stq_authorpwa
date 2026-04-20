import Dexie, { type Table } from 'dexie';
import type { TourDraft } from '@/schema';

/**
 * Stored image blob captured via getUserMedia or file picker.
 *
 * `id` is referenced from content blocks and riddle-level `imagePath`
 * fields by the `localBlobId` property while authoring. On export, the
 * blob is written to the ZIP and the reference is rewritten to a real
 * path.
 */
export interface StoredBlob {
  id: string;
  draftId: string;
  mime: string;
  blob: Blob;
  width?: number;
  height?: number;
  createdAt: number;
}

class AuthorDatabase extends Dexie {
  drafts!: Table<TourDraft, string>;
  blobs!: Table<StoredBlob, string>;

  constructor() {
    super('stq-author');
    this.version(1).stores({
      drafts: 'draftId, updatedAt',
      blobs: 'id, draftId',
    });
  }
}

export const db = new AuthorDatabase();
