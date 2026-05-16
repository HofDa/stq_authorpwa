import { useEffect, useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';

interface TimerWaitPlayerProps {
  durationMs: number;
  onCorrect: () => void;
  disabled?: boolean;
}

export function TimerWaitPlayer({
  durationMs,
  onCorrect,
  disabled = false,
}: TimerWaitPlayerProps) {
  const [startedAt] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(Date.now());
  const [solved, setSolved] = useState(false);
  const remainingMs = Math.max(0, durationMs - (nowMs - startedAt));

  useEffect(() => {
    if (disabled || solved) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [disabled, solved]);

  useEffect(() => {
    if (disabled || solved || remainingMs > 0) return;
    setSolved(true);
    onCorrect();
  }, [disabled, onCorrect, remainingMs, solved]);

  return (
    <ModuleFeedback
      kind={solved ? 'success' : 'running'}
      message={solved ? 'Wartezeit erfüllt' : 'Wartezeit läuft'}
      detail={
        solved ? undefined : `Noch ${Math.ceil(remainingMs / 1000)} s warten`
      }
      sensoryFeedback={solved ? { playKey: 'timer-wait-success' } : false}
    />
  );
}
