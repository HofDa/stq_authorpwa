export type QrScannerStatus =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'error';

export const QR_SCANNER_STATUS_COPY: Record<QrScannerStatus, string> = {
  idle: 'Kamera wird benötigt',
  requesting: 'Kamera wird benötigt',
  scanning: 'Kamera aktiv. QR-Code vor die Kamera halten.',
  success: 'QR-Code wurde gelesen.',
  denied: 'Kamera wurde nicht freigegeben.',
  unavailable: 'Kamera nicht verfügbar',
  error: 'QR-Code konnte nicht gelesen werden',
};

export const QR_SCANNER_INITIAL_DETAIL =
  'Die Kamera startet erst nach dem Tippen auf Kamera aktivieren. Kamera nicht verfügbar und QR-Code konnte nicht gelesen werden erscheinen als klare Hinweise.';

export function hasCameraApi(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function stopVideoTracks(video: HTMLVideoElement | null) {
  const stream = video?.srcObject as
    | { getTracks?: () => Array<{ stop: () => void }> }
    | null
    | undefined;
  stream?.getTracks?.().forEach((track) => track.stop());
  if (video) {
    video.srcObject = null;
  }
}

export function getCameraFailure(error: unknown): {
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
