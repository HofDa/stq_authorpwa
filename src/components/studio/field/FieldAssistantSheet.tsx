import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import {
  buildOpenClawPrompt,
  runLocalAssistantChecks,
  type AssistantFocus,
} from '@/assistant/openClaw';
import { Icon } from '../Icon';
import { stationCompleteness } from '../completeness';

interface Props {
  draft: TourDraft;
  locale: Locale;
  station?: RiddleEntry;
  onClose: () => void;
  /** Move to a different station while staying inside the assistant view. */
  onSelectStation?: (id: string) => void;
}

/**
 * Full-screen AI assistant view. Shown when the author taps the "Assistant"
 * button in the field bottom-nav. It carries the current station context,
 * shows a fitness score, calls out missing pieces, and offers a one-tap
 * voice prompt to capture observations on-site. The recorded transcript and
 * the rich `buildOpenClawPrompt` context are what the AI then uses to
 * suggest edits to the station.
 */
export function FieldAssistantSheet({
  draft,
  locale,
  station,
  onClose,
  onSelectStation,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const stationIndex = useMemo(
    () =>
      station ? draft.stations.findIndex((s) => s.id === station.id) : -1,
    [draft.stations, station],
  );
  const isFirst = stationIndex <= 0;
  const isLast =
    stationIndex < 0 || stationIndex >= draft.stations.length - 1;

  function step(delta: -1 | 1) {
    if (stationIndex < 0 || !onSelectStation) return;
    const next = stationIndex + delta;
    if (next < 0 || next >= draft.stations.length) return;
    onSelectStation(draft.stations[next].id);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OpenClaw assistant"
      className="stq-assistant-screen"
    >
      <div className="stq-assistant-topbar">
        <button
          type="button"
          onClick={onClose}
          className="studio-btn-icon"
          aria-label="Close assistant"
        >
          <Icon name="x" size={16} />
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--stq-primary)',
            textTransform: 'uppercase',
          }}
        >
          OpenClaw assistant
        </span>
        <span style={{ width: 34 }} aria-hidden />
      </div>

      <div className="stq-assistant-body studio-scroll">
        {station ? (
          <StationAssistantContent
            draft={draft}
            locale={locale}
            station={station}
            isFirst={isFirst}
            isLast={isLast}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 240,
              padding: 24,
              color: 'var(--stq-text-mute)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Select a station first — the assistant tailors its prompts to the
            station you are standing at.
          </div>
        )}
      </div>
    </div>
  );
}

function StationAssistantContent({
  draft,
  locale,
  station,
  isFirst,
  isLast,
  onPrev,
  onNext,
}: {
  draft: TourDraft;
  locale: Locale;
  station: RiddleEntry;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const stats = stationCompleteness(station, locale);
  const checks = useMemo(
    () => runLocalAssistantChecks({ draft, locale, kind: 'station', station }),
    [draft, locale, station],
  );
  const localized = station[locale];
  const stationTitle = localized.location || `Station ${station.number}`;

  // Story segments that match the design's 5-pip progress bar.
  const segments = useMemo(
    () => [
      { key: 'photo', label: 'Photo', done: stats.hasPhoto },
      { key: 'gps', label: 'GPS', done: stats.hasGps },
      {
        key: 'story',
        label: 'Story',
        done: localized.firstSection.length > 0,
      },
      { key: 'riddle', label: 'Riddle', done: stats.hasRiddle },
      {
        key: 'context',
        label: 'Context',
        done:
          localized.historySection.length > 0 ||
          localized.successSection.length > 0,
      },
    ],
    [stats, localized],
  );

  const readyLabel =
    stats.percent === 100
      ? 'Ready to ship'
      : stats.percent >= 75
        ? 'Almost there'
        : stats.percent >= 25
          ? 'Drafting'
          : 'Just started';

  const photoCount = (station.imageBlobId || station.imagePath) ? 1 : 0;
  const gpsLabel = stats.hasGps
    ? `${station.position_lat.toFixed(3)}°, ${station.position_lng.toFixed(3)}°`
    : 'No pin yet';
  const riddleLabel = stats.hasRiddle ? 'Written' : 'Missing';

  return (
    <>
      <div className="stq-assistant-header">
        <button
          type="button"
          className="studio-btn-icon"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous station"
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <FitnessScore percent={stats.percent} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--stq-primary)',
              textTransform: 'uppercase',
            }}
          >
            Station {station.number} · Fitness
          </div>
          <div
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stationTitle}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--stq-text-mute)',
              marginTop: 2,
            }}
          >
            {readyLabel}
          </div>
        </div>
        <button
          type="button"
          className="studio-btn-icon"
          onClick={onNext}
          disabled={isLast}
          aria-label="Next station"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <div className="stq-assistant-segments" aria-hidden>
        {segments.map((s) => (
          <div
            key={s.key}
            className={`stq-assistant-segment ${
              s.done ? 'stq-assistant-segment--done' : ''
            }`}
          />
        ))}
      </div>
      <div className="stq-assistant-segment-labels" aria-hidden>
        {segments.map((s) => (
          <span key={s.key}>{s.label.toUpperCase()}</span>
        ))}
      </div>

      <PromptCard stationTitle={stationTitle} />

      <div className="stq-assistant-fitness-grid">
        <FitnessCard
          icon="camera"
          label="Photo"
          value={photoCount > 0 ? `${photoCount} captured` : 'Missing'}
          done={photoCount > 0}
        />
        <FitnessCard
          icon="map-pin"
          label="GPS"
          value={gpsLabel}
          done={stats.hasGps}
        />
        <FitnessCard
          icon="type"
          label="Riddle"
          value={riddleLabel}
          done={stats.hasRiddle}
        />
        <FitnessCard
          icon="layers"
          label="Context"
          value={
            localized.historySection.length > 0 ||
            localized.successSection.length > 0
              ? `${localized.historySection.length + localized.successSection.length} blocks`
              : 'Add context'
          }
          done={
            localized.historySection.length > 0 ||
            localized.successSection.length > 0
          }
        />
      </div>

      {checks.length > 0 && (
        <div className="stq-assistant-checks">
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: 'var(--stq-primary)',
              textTransform: 'uppercase',
              padding: '0 4px 6px',
            }}
          >
            What's missing
          </div>
          {checks.map((check) => (
            <div
              key={`${check.level}:${check.title}`}
              className={`stq-assistant-check stq-assistant-check--${check.level}`}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {check.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--stq-text-mute)',
                  marginTop: 2,
                  lineHeight: 1.45,
                }}
              >
                {check.detail}
              </div>
            </div>
          ))}
        </div>
      )}

      <CaptureMicButton draft={draft} locale={locale} station={station} />
    </>
  );
}

function FitnessScore({ percent }: { percent: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  const tone =
    percent === 100
      ? 'var(--stq-success)'
      : percent >= 75
        ? 'var(--stq-success)'
        : percent >= 25
          ? 'var(--stq-amber)'
          : 'var(--stq-error)';
  return (
    <div className="stq-assistant-score" style={{ color: tone }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="rgba(35,25,25,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span>{percent}</span>
    </div>
  );
}

function PromptCard({ stationTitle }: { stationTitle: string }) {
  return (
    <div className="stq-assistant-prompt">
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'var(--stq-primary)',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Stand at the spot
      </div>
      <h3
        style={{
          fontFamily: 'Lato, Georgia, serif',
          fontSize: 22,
          fontWeight: 700,
          margin: '8px 0 6px',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        Tell me what you see at {stationTitle}.
      </h3>
      <p
        style={{
          fontSize: 13,
          color: 'var(--stq-text-mute)',
          lineHeight: 1.55,
          margin: 0,
          textAlign: 'center',
        }}
      >
        Hold the mic and talk — what's here, its history, what a tourist should
        notice. I'll split it into story blocks you can edit.
      </p>
    </div>
  );
}

function FitnessCard({
  icon,
  label,
  value,
  done,
}: {
  icon: 'camera' | 'map-pin' | 'type' | 'layers';
  label: string;
  value: string;
  done: boolean;
}) {
  return (
    <div className="stq-assistant-fitness-card">
      <div
        className={`stq-assistant-fitness-icon ${
          done ? 'stq-assistant-fitness-icon--done' : ''
        }`}
        aria-hidden
      >
        <Icon
          name={icon}
          size={16}
          color={done ? 'var(--stq-success)' : 'var(--stq-text-mute)'}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--stq-text-mute)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      </div>
      {done && (
        <Icon name="check-circle" size={16} color="var(--stq-success)" />
      )}
    </div>
  );
}

function CaptureMicButton({
  draft,
  locale,
  station,
}: {
  draft: TourDraft;
  locale: Locale;
  station: RiddleEntry;
}) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const recognitionRef = useRef<unknown>(null);
  const supports = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      const r = recognitionRef.current as { stop?: () => void } | null;
      r?.stop?.();
    };
  }, []);

  function start() {
    if (recording) return;
    if (!supports) {
      setRecording(true);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setRecording(true);
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : 'en-US';
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stop() {
    const r = recognitionRef.current as { stop?: () => void } | null;
    r?.stop?.();
    setRecording(false);
  }

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
      alert('Could not copy to clipboard on this device.');
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
              fontFamily: 'Lato, Georgia, serif',
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
              onClick={() => setTranscript('')}
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
        onPointerDown={start}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
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
          ? supports
            ? 'Recording — release to stop'
            : 'Voice unavailable — type into the station instead'
          : 'Hold to describe the spot'}
      </div>
    </div>
  );
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEventLike) => void;
  onerror: () => void;
  onend: () => void;
}

// Suppress unused-warning for the focus type while keeping the import path
// stable for future iteration.
export type FieldAssistantFocus = AssistantFocus;
