import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { getBlob } from '@/media/imagePipeline';

/**
 * Resolves a Dexie `localBlobId` to an object URL the browser can render.
 * Revokes the URL on change or unmount.
 */
export function useBlobUrl(blobId: string | undefined): string | undefined {
  const blob = useLiveQuery(
    async () => (blobId ? (await getBlob(blobId))?.blob : undefined),
    [blobId],
  );
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const created = URL.createObjectURL(blob);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [blob]);

  return url;
}
