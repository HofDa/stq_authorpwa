import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale, StorylineMessage, TourDraft } from '@/schema';
import { Icon } from '../Icon';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  "It's about the trilingual identity",
  'Sensory history — smells, sounds, stone',
  'A medieval merchant detective story',
  'Slow walking, with surprises',
  'I have a draft already',
];

/**
 * Conversational AI editor for the tour-wide storyline. Persists both the
 * chat thread and a derived markdown document on `draft.storyline`. The
 * markdown is then injected into the per-station assistant context (see
 * `buildOpenClawPrompt`) so OpenClaw stays consistent with the tour's arc.
 */
export function FieldStorylineScreen({
  draft,
  locale,
  onChange,
  onClose,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const messages = draft.storyline?.chat ?? [];
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tourTitle = draft.tour[locale].title || 'this tour';

  // Seed the very first assistant message so the screen never starts empty.
  useEffect(() => {
    if (messages.length > 0) return;
    const seedAssistant: StorylineMessage = {
      role: 'assistant',
      content: `I'll help you shape an overarching storyline for ${tourTitle}. The clearer this draft, the better every per-station AI call will be downstream.`,
    } as StorylineMessage;
    const seedFollowUp: StorylineMessage = {
      role: 'assistant',
      content:
        'Tell me about the tour you imagine. We’ll find the arc together — start anywhere:',
    } as StorylineMessage;
    onChange((prev) => ({
      ...prev,
      storyline: {
        markdown: prev.storyline?.markdown ?? '',
        updatedAt: prev.storyline?.updatedAt ?? 0,
        chat: [
          { ...seedAssistant, ts: Date.now() },
          { ...seedFollowUp, ts: Date.now() + 1 },
        ],
      },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stick to the bottom on every new message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function appendMessage(message: StorylineMessage) {
    onChange((prev) => {
      const chat = [...(prev.storyline?.chat ?? []), message];
      const markdown = renderStorylineMarkdown(prev.tour[locale].title, chat);
      return {
        ...prev,
        storyline: {
          markdown,
          updatedAt: Date.now(),
          chat,
        },
      };
    });
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    appendMessage({ role: 'user', content: trimmed, ts: Date.now() });
    setInput('');
    // Synthesize a local assistant reply. (When a real LLM endpoint is wired
    // up, replace this with a streaming call seeded with the chat history.)
    const reply = synthesizeReply(trimmed, messages.length);
    window.setTimeout(() => {
      appendMessage({ role: 'assistant', content: reply, ts: Date.now() });
    }, 250);
  }

  const supportsSpeech = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const w = window as unknown as {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  function startDictate() {
    if (recording) return;
    if (!supportsSpeech) return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      locale === 'de' ? 'de-DE' : locale === 'it' ? 'it-IT' : 'en-US';
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setInput(text);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  function stopDictate() {
    const r = recognitionRef.current as { stop?: () => void } | null;
    r?.stop?.();
    setRecording(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Storyline draft"
      className="stq-storyline-screen"
    >
      <div className="stq-storyline-topbar">
        <div className="stq-storyline-topbar-icon" aria-hidden>
          <Icon name="sparkles" size={14} color="var(--stq-primary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--stq-primary)',
              textTransform: 'uppercase',
            }}
          >
            Storyline draft · OpenClaw
          </div>
          <div
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tourTitle}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="studio-btn-icon"
          aria-label="Close storyline"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="stq-storyline-thread studio-scroll">
        {messages.map((msg, i) => (
          <ChatBubble key={`${msg.ts}-${i}`} message={msg} />
        ))}

        {messages.length > 0 &&
          messages[messages.length - 1].role === 'assistant' &&
          !messages.some((m) => m.role === 'user') && (
            <div className="stq-storyline-suggestions">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="stq-storyline-suggestion"
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
      </div>

      <form
        className="stq-storyline-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (recording) stopDictate();
          send(input);
        }}
      >
        <button
          type="button"
          className={`stq-storyline-mic ${
            recording ? 'stq-storyline-mic--rec' : ''
          }`}
          onClick={recording ? stopDictate : startDictate}
          aria-pressed={recording}
          aria-label={recording ? 'Stop dictation' : 'Dictate message'}
          disabled={!supportsSpeech && !recording}
        >
          <Icon name="mic" size={16} />
        </button>
        <input
          className="stq-storyline-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type, dictate, or tap a suggestion…"
        />
        <button
          type="submit"
          className="stq-storyline-send"
          aria-label="Send"
          disabled={!input.trim()}
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: StorylineMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`stq-storyline-bubble ${
        isUser ? 'stq-storyline-bubble--user' : 'stq-storyline-bubble--assistant'
      }`}
    >
      {!isUser && (
        <div className="stq-storyline-bubble-icon" aria-hidden>
          <Icon name="sparkles" size={11} color="var(--stq-primary)" />
        </div>
      )}
      <div className="stq-storyline-bubble-text">{message.content}</div>
    </div>
  );
}

function synthesizeReply(userText: string, turnIndex: number): string {
  const lower = userText.toLowerCase();
  const themes: string[] = [];
  if (/(language|trilingu|german|italian|ladin)/.test(lower)) {
    themes.push('three languages braided through every block');
  }
  if (/(smell|sound|sensory|stone|wood)/.test(lower)) {
    themes.push('sensory anchors — what the tourist hears, smells, touches');
  }
  if (/(detective|mystery|merchant|secret|riddle)/.test(lower)) {
    themes.push('a layered mystery hook that pulls between stations');
  }
  if (/(slow|walk|pace|breath|linger)/.test(lower)) {
    themes.push('slow-walking pace with deliberate pauses');
  }
  if (/(twist|surprise|unexpected)/.test(lower)) {
    themes.push('a mid-tour twist that recontextualizes the first stop');
  }

  const themeLine =
    themes.length > 0
      ? `Got it — I'll keep ${themes.join(', ')} as load-bearing motifs.`
      : `Noted: "${userText.slice(0, 80)}${userText.length > 80 ? '…' : ''}".`;

  if (turnIndex < 2) {
    return [
      themeLine,
      'A few directions to push on next:',
      '• What’s the tour’s emotional arc — start, midpoint reversal, payoff?',
      '• Is there a deus-ex-machina moment you want to plant for the final station?',
      '• What tone — wry, reverent, conspiratorial, dryly historical?',
    ].join('\n');
  }

  if (turnIndex < 4) {
    return [
      themeLine,
      'Pulling that into the storyline draft. Want to lock the tone next, or sketch the twist?',
    ].join('\n');
  }

  return [
    themeLine,
    'Saved into the storyline. The per-station assistant will reference this when you draft individual stops, so your hooks and tone stay consistent.',
  ].join('\n');
}

function renderStorylineMarkdown(
  title: string,
  chat: StorylineMessage[],
): string {
  const heading = `# Storyline draft${title ? ` — ${title}` : ''}`;
  const intro =
    '_Author-only narrative bible. Referenced by the per-station AI assistant._';
  const turns = chat
    .map((msg) => {
      const speaker = msg.role === 'user' ? '**Author**' : '**OpenClaw**';
      return `${speaker}: ${msg.content}`;
    })
    .join('\n\n');
  return [heading, '', intro, '', turns].join('\n').trim() + '\n';
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
