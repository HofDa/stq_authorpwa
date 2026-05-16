import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import {
  getCameraFailure,
  hasCameraApi,
  QR_SCANNER_INITIAL_DETAIL,
  type QrScannerStatus,
  stopVideoTracks,
} from './qrScannerModel';

interface UseQrScannerSessionOptions {
  onScan: (value: string) => void;
  onStatusChange?: (status: QrScannerStatus) => void;
}

export function useQrScannerSession({
  onScan,
  onStatusChange,
}: UseQrScannerSessionOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const mountedRef = useRef(true);
  const completedRef = useRef(false);
  const [status, setStatus] = useState<QrScannerStatus>('idle');
  const [detail, setDetail] = useState(QR_SCANNER_INITIAL_DETAIL);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    stopVideoTracks(videoRef.current);
  }, []);

  const startScanner = useCallback(async () => {
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
  }, [onScan, status, stopScanner]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, [stopScanner]);

  return {
    detail,
    isBusy: status === 'requesting' || status === 'scanning',
    startScanner,
    status,
    videoRef,
  };
}
