import { Suspense, lazy, useState } from 'react';
import type { QrScannerStatus } from '@/components/rrr-runtime/QrScanner';
import { ModuleFeedback } from './ModuleFeedback';
import { TextAnswerPlayer } from './TextAnswerPlayer';

const QrScanner = lazy(() =>
  import('@/components/rrr-runtime/QrScanner').then((module) => ({
    default: module.QrScanner,
  })),
);

interface QrScanPlayerProps {
  expectedValue: string;
  fallbackAnswers: string[];
  submitLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

const FALLBACK_TRIGGER_STATUSES: ReadonlyArray<QrScannerStatus> = [
  'denied',
  'unavailable',
  'error',
];

export function QrScanPlayer({
  expectedValue,
  fallbackAnswers,
  submitLabel,
  onCorrect,
  disabled = false,
}: QrScanPlayerProps) {
  const [mismatch, setMismatch] = useState(false);
  const [scanned, setScanned] = useState<string | null>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const trimmedExpected = expectedValue.trim();
  const hasExpectedValue = trimmedExpected.length > 0;
  const hasFallback = fallbackAnswers.some(
    (answer) => answer.trim().length > 0,
  );

  function handleScan(value: string) {
    if (disabled) return;
    const trimmed = value.trim();
    setScanned(trimmed);
    if (!hasExpectedValue) {
      setMismatch(true);
      return;
    }
    if (trimmed === trimmedExpected) {
      setMismatch(false);
      onCorrect();
      return;
    }
    setMismatch(true);
  }

  function handleStatusChange(status: QrScannerStatus) {
    if (!hasFallback || fallbackOpen) return;
    if (FALLBACK_TRIGGER_STATUSES.includes(status)) {
      setFallbackOpen(true);
    }
  }

  return (
    <div className="stq-riddle-qr-player">
      <Suspense fallback={<ScannerLoading />}>
        <QrScanner
          fallbackAvailable={hasFallback && !fallbackOpen}
          onScan={handleScan}
          onStatusChange={handleStatusChange}
          onUseFallback={
            hasFallback && !fallbackOpen
              ? () => setFallbackOpen(true)
              : undefined
          }
        />
      </Suspense>

      <ModuleFeedback
        kind={mismatch && scanned !== null ? 'error' : 'idle'}
        message={
          mismatch && scanned !== null
            ? hasExpectedValue
              ? `Der gelesene Wert „${scanned}“ passt nicht.`
              : 'Für diese Station ist noch kein QR-Wert hinterlegt.'
            : undefined
        }
      />

      {hasFallback && fallbackOpen && (
        <div className="stq-riddle-qr-player__fallback">
          <p className="stq-riddle-qr-player__fallback-hint">
            Gib den Ersatzcode ein, falls die Kamera nicht funktioniert.
          </p>
          <TextAnswerPlayer
            acceptedAnswers={fallbackAnswers}
            submitLabel={submitLabel}
            onCorrect={onCorrect}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

function ScannerLoading() {
  return (
    <div className="stq-riddle-qr-player__loading" role="status">
      Kamera wird geladen…
    </div>
  );
}
