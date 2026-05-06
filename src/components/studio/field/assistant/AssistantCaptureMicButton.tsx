import { useState } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { buildOpenClawPrompt } from '@/assistant/openClaw';
import { Icon } from '../../Icon';
import { useToast } from '@/components/ui/FeedbackProvider';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';

interface AssistantCaptureMicButtonProps {
  draft: TourDraft;
  locale: Locale;
  station: RiddleEntry;
}

export function AssistantCaptureMicButton({
  draft,
  locale,
  station,
}: AssistantCaptureMicButtonProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const toast = useToast();
  const {
    recording,
    supportsSpeech,
    transcript,
    clearTranscript,
    startDictation,
    stopDictation,
  } = useSpeechDictation({
    locale,
    recordWhenUnsupported: true,
  });

  async function copyPrompt() {
    const prompt = buildOpenClawPrompt(
      { draft, locale, kind: 'station', station },
      'narrative',
      transcript ||
        `I am standing at ${station[locale].location || `station ${station.number}`}. Help me draft this station based on the captured observations.`,
    );
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      toast({
        title: 'Clipboard unavailable',
        message: 'Could not copy the assistant prompt on this device.',
        tone: 'error',
      });
    }
  }

  return (
    <div className="stq-assistant-mic">
      {transcript && (
        <div className="stq-assistant-transcript">
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: 'var(--stq-primary)',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Transcript
          </div>
          <p
            style={{
              fontFamily: 'var(--stq-font-ui)',
              fontSize: 14,
              lineHeight: 1.5,
              margin: 0,
              color: 'var(--stq-text)',
            }}
          >
            {transcript}
          </p>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              type="button"
              className="studio-btn-ghost"
              style={{ minHeight: 34, fontSize: 12 }}
              onClick={clearTranscript}
            >
              Clear
            </button>
            <button
              type="button"
              className="studio-btn-primary"
              style={{ minHeight: 34, fontSize: 12 }}
              onClick={copyPrompt}
            >
              <Icon name="sparkles" size={13} />
              {copyState === 'copied' ? 'Copied!' : 'Copy AI prompt'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={startDictation}
        onPointerUp={stopDictation}
        onPointerCancel={stopDictation}
        onPointerLeave={stopDictation}
        className={`stq-assistant-mic-btn ${
          recording ? 'stq-assistant-mic-btn--rec' : ''
        }`}
        aria-pressed={recording}
        aria-label={
          recording ? 'Recording — release to stop' : 'Hold to describe the spot'
        }
      >
        <Icon name="mic" size={28} color="white" />
      </button>
      <div className="stq-assistant-mic-hint">
        {recording
          ? supportsSpeech
            ? 'Recording — release to stop'
            : 'Voice unavailable — type into the station instead'
          : 'Hold to describe the spot'}
      </div>
    </div>
  );
}
