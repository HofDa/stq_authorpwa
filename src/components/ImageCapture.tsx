import { useEffect, useRef, useState } from 'react';
import { storeImageBlob, type ImagePreset } from '@/media/imagePipeline';
import { useBlobUrl } from '@/hooks/useBlobUrl';

interface Props {
  draftId: string;
  preset: ImagePreset;
  blobId?: string;
  onCaptured: (blobId: string) => void;
  aspectClass?: string;
  label?: string;
  rounded?: 'md' | 'none';
  captureSignal?: number;
}

/**
 * Tappable placeholder that opens the phone camera (or file picker on
 * desktop) to capture/select an image, resizes it to WebP, persists the
 * blob in IndexedDB, and reports the new `localBlobId` upwards.
 *
 * Shows a live preview of the captured image when `blobId` is set.
 */
export function ImageCapture({
  draftId,
  preset,
  blobId,
  onCaptured,
  aspectClass = 'aspect-[3/2]',
  label = 'Tap to take a photo',
  rounded = 'md',
  captureSignal = 0,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = useBlobUrl(blobId);

  useEffect(() => {
    if (captureSignal > 0 && !busy) inputRef.current?.click();
  }, [busy, captureSignal]);

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const stored = await storeImageBlob(draftId, file, preset);
      onCaptured(stored.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setBusy(false);
    }
  }

  const radiusClass = rounded === 'md' ? 'rounded-md' : '';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={[
          'relative block w-full overflow-hidden border border-dashed',
          'border-border bg-white/60 text-disabled transition',
          'hover:border-primary hover:bg-primary/5',
          aspectClass,
          radiusClass,
        ].join(' ')}
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2 text-center">
            <span aria-hidden className="text-3xl">📷</span>
            <span className="text-labelSm text-text">{label}</span>
            <span className="text-bodySm text-disabled">
              {busy ? 'Processing…' : 'Camera or gallery'}
            </span>
          </span>
        )}
        {url && (
          <span
            className="absolute bottom-2 right-2 rounded-full bg-black/60
                       px-2 py-1 text-labelSm text-white"
          >
            📷 Retake
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChosen}
      />
      {error && <p className="mt-1 text-bodySm text-error">{error}</p>}
    </div>
  );
}
