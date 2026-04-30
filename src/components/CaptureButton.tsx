import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { storeImageBlob, type ImagePreset } from '@/media/imagePipeline';

interface Props {
  draftId: string;
  preset: ImagePreset;
  onCaptured: (blobId: string) => void;
  label?: ReactNode;
  className?: string;
  ariaLabel?: string;
  capture?: 'environment' | 'user' | false;
}

/**
 * Compact "retake" button that triggers a camera capture without taking up
 * layout space. Useful as an overlay on top of an existing photo.
 */
export function CaptureButton({
  draftId,
  preset,
  onCaptured,
  label = '📷 Retake',
  className,
  ariaLabel,
  capture = 'environment',
}: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const stored = await storeImageBlob(draftId, file, preset);
      onCaptured(stored.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        aria-label={ariaLabel}
        className={
          className ??
          'rounded-full bg-black/60 px-3 py-1 text-labelSm text-white shadow'
        }
      >
        {busy ? '…' : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture={capture === false ? undefined : capture}
        className="hidden"
        onChange={handle}
      />
    </>
  );
}
