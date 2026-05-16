import { useEffect, useRef } from 'react';
import {
  RRR_FEEDBACK_PATTERNS,
  type RrrFeedbackPattern,
} from '@/rrr/feedbackPatterns';
import type { ModuleFeedbackKind } from './moduleFeedbackTypes';
import { playSensoryFeedback } from './sensoryFeedback';

export interface ModuleSensoryFeedbackOptions {
  pattern?: RrrFeedbackPattern;
  audio?: boolean;
  haptic?: boolean;
  volumeScale?: number;
  playKey?: string | number;
}

export type ModuleSensoryFeedbackSetting =
  | boolean
  | ModuleSensoryFeedbackOptions;

export function useSensoryFeedbackCue(
  kind: ModuleFeedbackKind,
  setting: ModuleSensoryFeedbackSetting | undefined,
) {
  const lastSignatureRef = useRef<string>('');

  useEffect(() => {
    if (!setting || kind === 'idle') return;

    const options = typeof setting === 'boolean' ? {} : setting;
    const pattern = options.pattern ?? getDefaultPattern(kind);
    if (!pattern) return;

    const signature = `${kind}:${options.playKey ?? 'default'}`;
    if (lastSignatureRef.current === signature) return;
    lastSignatureRef.current = signature;

    playSensoryFeedback(pattern, {
      audio: options.audio,
      haptic: options.haptic,
      volumeScale: options.volumeScale,
    });
  }, [kind, setting]);
}

function getDefaultPattern(kind: ModuleFeedbackKind): RrrFeedbackPattern | undefined {
  switch (kind) {
    case 'success':
      return RRR_FEEDBACK_PATTERNS.success;
    case 'error':
      return RRR_FEEDBACK_PATTERNS.error;
    case 'running':
    case 'info':
      return RRR_FEEDBACK_PATTERNS.tap;
    case 'idle':
      return undefined;
  }
}
