import {
  QR_SCANNER_STATUS_COPY,
  type QrScannerStatus,
} from './qrScannerModel';
import { useQrScannerSession } from './useQrScannerSession';

export type { QrScannerStatus } from './qrScannerModel';

interface QrScannerProps {
  fallbackAvailable?: boolean;
  onScan: (value: string) => void;
  onStatusChange?: (status: QrScannerStatus) => void;
  onUseFallback?: () => void;
}

export function QrScanner({
  fallbackAvailable = false,
  onScan,
  onStatusChange,
  onUseFallback,
}: QrScannerProps) {
  const { detail, isBusy, startScanner, status, videoRef } =
    useQrScannerSession({
      onScan,
      onStatusChange,
    });
  const tone =
    status === 'denied' || status === 'unavailable' || status === 'error'
      ? 'error'
      : status === 'success'
        ? 'success'
        : 'neutral';

  return (
    <div className="stq-qr-scanner">
      <div className={`stq-qr-scanner__status stq-qr-scanner__status--${tone}`}>
        <strong>{QR_SCANNER_STATUS_COPY[status]}</strong>
        {detail && status !== 'idle' ? <small>{detail}</small> : null}
      </div>

      <video
        ref={videoRef}
        className="stq-qr-scanner__video"
        muted
        playsInline
        autoPlay
        aria-label="QR-Kamera-Vorschau"
      />

      <div className="stq-rrr-guide__choice">
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={startScanner}
          disabled={isBusy}
        >
          Kamera aktivieren
        </button>
        {fallbackAvailable ? (
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={onUseFallback}
            disabled={!onUseFallback}
            aria-disabled={!onUseFallback || undefined}
          >
            Ersatzlösung verwenden
          </button>
        ) : null}
      </div>
    </div>
  );
}
