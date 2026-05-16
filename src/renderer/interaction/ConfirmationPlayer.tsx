import { useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';

interface ConfirmationPlayerProps {
  eyebrow: string;
  prompt: string;
  fallbackPrompt: string;
  confirmLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function ConfirmationPlayer({
  eyebrow,
  prompt,
  fallbackPrompt,
  confirmLabel,
  onCorrect,
  disabled = false,
}: ConfirmationPlayerProps) {
  const [confirmed, setConfirmed] = useState(false);

  function confirm() {
    if (disabled || confirmed) return;
    setConfirmed(true);
    onCorrect();
  }

  return (
    <div className="stq-riddle-confirmation-player">
      <ModuleFeedback
        kind={confirmed ? 'success' : 'running'}
        eyebrow={eyebrow}
        message={prompt.trim() || fallbackPrompt}
        detail={confirmed ? 'Bestätigt' : undefined}
        sensoryFeedback={confirmed ? { playKey: `${eyebrow}-success` } : false}
      />
      <button
        type="button"
        className="stq-riddle-compass-player__enable"
        onClick={confirm}
        disabled={disabled || confirmed}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
