import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';

type QrScannerStatus =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'error';

interface QrScannerProps {
  fallbackAvailable?: boolean;
  onScan: (value: string) => void;
}

const STATUS_COPY: Record<QrScannerStatus, string> = {
  idle: 'Kamera wird benötigt',
  requesting: 'Kamera wird benötigt',
  scanning: 'Kamera aktiv. QR-Code vor die Kamera halten.',
  success: 'QR-Code wurde gelesen.',
  denied: 'Kamera wurde nicht freigegeben.',
  unavailable: 'Kamera nicht verfügbar',
  error: 'QR-Code konnte nicht gelesen werden',
};

export function QrScanner({
  fallbackAvailable = false,
  onScan,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const mountedRef = useRef(true);
  const completedRef = useRef(false);
  const [status, setStatus] = useState<QrScannerStatus>('idle');
  const [detail, setDetail] = useState(
    'Die Kamera startet erst nach dem Tippen auf Kamera aktivieren. Kamera nicht verfügbar und QR-Code konnte nicht gelesen werden erscheinen als klare Hinweise.',
  );

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    stopVideoTracks(videoRef.current);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  async function startScanner() {
    if (status === 'requesting' || status === 'scanning') {
      return;
    }

    if (!hasCameraApi()) {
      setStatus('unavailable');
      setDetail(
        'Auf diesem Gerät oder in diesem Browser ist keine Kamera verfügbar.',
      );
      return;
    }

    stopScanner();
    completedRef.current = false;
    setStatus('requesting');
    setDetail('Der Browser fragt jetzt nach Kamerazugriff.');

    try {
      // ZXing keeps QR decoding isolated and maintained; no custom decoder or
      // rrr-core browser API dependency is introduced here.
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
          },
        },
        videoRef.current ?? undefined,
        (result, error, controlsFromCallback) => {
          if (!mountedRef.current || completedRef.current) {
            return;
          }

          const value = result?.getText().trim();
          if (value) {
            completedRef.current = true;
            controlsFromCallback.stop();
            controlsRef.current = null;
            stopVideoTracks(videoRef.current);
            setStatus('success');
            setDetail('Der erkannte Wert wurde in den QR-Test übernommen.');
            onScan(value);
            return;
          }

          if (error) {
            setStatus('scanning');
            setDetail('QR-Code konnte nicht gelesen werden. Bitte erneut ausrichten.');
          }
        },
      );

      controlsRef.current = controls;
      if (mountedRef.current && !completedRef.current) {
        setStatus('scanning');
        setDetail('Die Kamera ist aktiv. Es wird nichts hochgeladen.');
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      stopScanner();
      const failure = getCameraFailure(error);
      setStatus(failure.status);
      setDetail(failure.detail);
    }
  }

  const isBusy = status === 'requesting' || status === 'scanning';
  const statusTone =
    status === 'denied' || status === 'unavailable' || status === 'error'
      ? 'failed'
      : status === 'success'
        ? 'success'
        : 'running';

  return (
    <div className="stq-qr-scanner">
      <div className="stq-rrr-guide__feedback">
        <div>
          <span>{STATUS_COPY[status]}</span>
          <strong>
            {status === 'idle'
              ? 'Zum echten Scannen muss der Spieler die Kamera freigeben.'
              : STATUS_COPY[status]}
          </strong>
          <small>{detail}</small>
          {fallbackAvailable ? (
            <small>
              Falls die Kamera nicht funktioniert, kann die Ersatzlösung
              verwendet werden.
            </small>
          ) : null}
        </div>
        <span className={`stq-rrr-status stq-rrr-status--${statusTone}`}>
          {getStatusLabel(status)}
        </span>
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
            disabled
            aria-disabled="true"
          >
            Ersatzlösung verwenden
          </button>
        ) : null}
      </div>
    </div>
  );
}

function hasCameraApi(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

function stopVideoTracks(video: HTMLVideoElement | null) {
  const stream = video?.srcObject as
    | { getTracks?: () => Array<{ stop: () => void }> }
    | null
    | undefined;
  stream?.getTracks?.().forEach((track) => track.stop());
  if (video) {
    video.srcObject = null;
  }
}

function getCameraFailure(error: unknown): {
  status: Extract<QrScannerStatus, 'denied' | 'unavailable' | 'error'>;
  detail: string;
} {
  const name =
    typeof DOMException !== 'undefined' && error instanceof DOMException
      ? error.name
      : typeof error === 'object' && error !== null && 'name' in error
        ? String(error.name)
        : '';

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      status: 'denied',
      detail:
        'Die Kamerafreigabe wurde abgelehnt. Prüfe die Browser- oder Systemeinstellungen.',
    };
  }

  if (
    name === 'NotFoundError' ||
    name === 'NotReadableError' ||
    name === 'OverconstrainedError'
  ) {
    return {
      status: 'unavailable',
      detail:
        'Die Kamera ist auf diesem Gerät nicht verfügbar oder bereits belegt.',
    };
  }

  return {
    status: 'error',
    detail: 'QR-Code konnte nicht gelesen werden. Bitte erneut versuchen.',
  };
}

function getStatusLabel(status: QrScannerStatus): string {
  switch (status) {
    case 'idle':
      return 'Bereit';
    case 'requesting':
      return 'Fragt an';
    case 'scanning':
      return 'Aktiv';
    case 'success':
      return 'Erfüllt';
    case 'denied':
    case 'unavailable':
    case 'error':
      return 'Hinweis';
  }
}
