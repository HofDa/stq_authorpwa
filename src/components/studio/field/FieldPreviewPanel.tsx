import type { ReactNode } from 'react';

interface Props {
  /** Kept for API compatibility; no longer affects rendering. */
  embedded?: boolean;
  exitLabel?: string;
  onExit?: () => void;
  gpsLive?: boolean;
  gpsAccuracy?: number | null;
  children: ReactNode;
}

/**
 * Field-mode chrome wrapper. Renders edge-to-edge in every viewport — no
 * fake phone frame, no simulated status bar. The real header lives in
 * {@link FieldHeader}.
 */
export function FieldPreviewPanel({ children }: Props) {
  return (
    <div className="stq-field-page">
      <div className="stq-field-screen stq-field-screen--embedded">
        {children}
      </div>
    </div>
  );
}
