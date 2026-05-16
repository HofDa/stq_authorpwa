import { useEffect, useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';
import { useLiveDeviceBalance } from '@/components/rrr-runtime/useLiveDeviceBalance';

interface HoldStillPlayerProps {
  durationMs: number;
  onCorrect: () => void;
  disabled?: boolean;
}

export function HoldStillPlayer({
  durationMs,
  onCorrect,
  disabled = false,
}: HoldStillPlayerProps) {
  const balance = useLiveDeviceBalance();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [solved, setSolved] = useState(false);
  const isStill =
    balance.status === 'available' &&
    (balance.magnitude === undefined || balance.magnitude <= 2);
  const elapsedMs = startedAt === null ? 0 : nowMs - startedAt;

  useEffect(() => {
    if (disabled || solved) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [disabled, solved]);

  useEffect(() => {
    if (disabled || solved || balance.status !== 'available') return;
    if (!isStill) {
      setStartedAt(null);
      return;
    }
    setStartedAt((current) => current ?? Date.now());
  }, [balance.status, disabled, isStill, solved]);

  useEffect(() => {
    if (disabled || solved || startedAt === null || elapsedMs < durationMs) return;
    setSolved(true);
    onCorrect();
  }, [disabled, durationMs, elapsedMs, onCorrect, solved, startedAt]);

  return (
    <div className="stq-riddle-hold-still-player">
      <ModuleFeedback
        kind={solved ? 'success' : isStill ? 'running' : 'idle'}
        message={
          solved
            ? 'Stillhalten geschafft'
            : isStill
              ? 'Ruhig halten'
              : 'Halte das Gerät ruhig'
        }
        detail={
          isStill && !solved
            ? `${Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000))} s`
            : undefined
        }
        sensoryFeedback={solved ? { playKey: 'hold-still-success' } : false}
      />
      {balance.status !== 'available' && balance.status !== 'unavailable' && (
        <button
          type="button"
          className="stq-riddle-compass-player__enable"
          onClick={balance.start}
          disabled={balance.status === 'starting' || disabled}
        >
          {balance.status === 'starting'
            ? 'Sensor wird gestartet...'
            : 'Sensor aktivieren'}
        </button>
      )}
    </div>
  );
}
