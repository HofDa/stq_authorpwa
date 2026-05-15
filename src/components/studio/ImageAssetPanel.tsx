import { useRef, useState, type ReactNode } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { storeImageBlob, type ImagePreset } from '@/media/imagePipeline';
import { Icon } from './Icon';

interface ImageAssetPanelProps {
  draftId: string;
  label: string;
  imageUrl: string | undefined;
  imagePath: string;
  imageBlobId: string | undefined;
  preset: ImagePreset;
  onBlobStored: (blobId: string) => void;
  onPathChange: (path: string) => void;
  children?: ReactNode;
}

export function ImageAssetPanel({
  draftId,
  label,
  imageUrl,
  imagePath,
  imageBlobId,
  preset,
  onBlobStored,
  onPathChange,
  children,
}: ImageAssetPanelProps) {
  const { t } = useEditorLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const stored = await storeImageBlob(draftId, file, preset);
      onBlobStored(stored.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setBusy(false);
    }
  }

  const hasImage = Boolean(imageUrl ?? (imagePath && !imageBlobId));
  const statusLabel = imageBlobId
    ? t('studio.imageSelected')
    : imagePath || t('studio.imageSelected');

  return (
    <div className="stq-cover-panel">
      <div className="stq-edit-panel-label">{label}</div>

      <div className="stq-cover-actions">
        <button
          type="button"
          className="stq-cover-action"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Icon name="camera" size={14} />
          <span>{t('studio.takePhoto')}</span>
        </button>
        <button
          type="button"
          className="stq-cover-action"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="upload" size={14} />
          <span>{t('studio.upload')}</span>
        </button>
      </div>

      {hasImage && (
        <div className="stq-cover-status" title={statusLabel}>
          {statusLabel}
        </div>
      )}

      <div className="stq-cover-format-hint" aria-live="polite">
        {busy ? '...' : t('studio.imageFormatHint')}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />

      <input
        type="text"
        className="stq-edit-panel-input"
        value={imageBlobId ? '' : imagePath}
        placeholder={t('studio.imageUrlPlaceholder')}
        onChange={(event) => onPathChange(event.target.value)}
      />

      {error && (
        <p style={{ color: 'var(--stq-color-danger)', fontSize: 12, margin: 0 }}>{error}</p>
      )}

      {children}
    </div>
  );
}
