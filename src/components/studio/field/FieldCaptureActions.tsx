import { useRef } from 'react';
import { ImageCapture } from '@/components/ImageCapture';
import { Icon } from '../Icon';

interface Props {
  draftId: string;
  currentBlobId?: string;
  gpsAvailable: boolean;
  onPinHere: () => void;
  onPhotoCaptured: (blobId: string) => void;
}

export function FieldCaptureActions({
  draftId,
  currentBlobId,
  gpsAvailable,
  onPinHere,
  onPhotoCaptured,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
      <button
        type="button"
        className="studio-chip stq-field-action-chip"
        onClick={onPinHere}
        disabled={!gpsAvailable}
        style={{ flex: 1, justifyContent: 'center', background: 'var(--stq-bg)' }}
      >
        <Icon name="map-pin" size={11} />
        {gpsAvailable ? 'Use GPS here' : 'GPS off'}
      </button>
      <PhotographChip
        draftId={draftId}
        currentBlobId={currentBlobId}
        onCaptured={onPhotoCaptured}
      />
    </div>
  );
}

function PhotographChip({
  draftId,
  currentBlobId,
  onCaptured,
}: {
  draftId: string;
  currentBlobId?: string;
  onCaptured: (blobId: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
      <button
        type="button"
        className="studio-chip stq-field-action-chip"
        style={{ width: '100%', justifyContent: 'center', background: 'var(--stq-bg)' }}
        onClick={() => {
          const input = wrapperRef.current?.querySelector<HTMLInputElement>(
            'input[type="file"]',
          );
          input?.click();
        }}
      >
        <Icon name="camera" size={11} />
        Photograph
      </button>
      <div style={{ display: 'none' }}>
        <ImageCapture
          draftId={draftId}
          preset="station"
          blobId={currentBlobId}
          onCaptured={onCaptured}
          label="Photograph"
        />
      </div>
    </div>
  );
}
