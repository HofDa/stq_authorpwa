import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/schema';
import { Icon } from '@/components/studio/Icon';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export type TourAiPanelMode = 'image' | 'intro';

interface Props {
  locale: Locale;
  tourTitle: string;
  mode: TourAiPanelMode;
  onModeChange: (mode: TourAiPanelMode) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOUR_AI_PANEL_MODES: Array<{
  mode: TourAiPanelMode;
  icon: 'wand' | 'sparkles';
  label: string;
}> = [
  { mode: 'image', icon: 'wand', label: 'Image AI' },
  { mode: 'intro', icon: 'sparkles', label: 'Intro AI' },
];

export function TourAiSidePanel({
  locale,
  tourTitle,
  mode,
  onModeChange,
  open,
  onOpenChange,
}: Props) {
  const [input, setInput] = useState('');
  const dragStartX = useRef<number | null>(null);
  const handledDrag = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages(mode, tourTitle),
  );
  const { recording, supportsSpeech, startDictation, stopDictation } =
    useSpeechDictation({
      locale,
      onTranscript: setInput,
    });
  const activeMode =
    TOUR_AI_PANEL_MODES.find((item) => item.mode === mode) ?? TOUR_AI_PANEL_MODES[0];

  useEffect(() => {
    setInput('');
    setMessages(initialMessages(mode, tourTitle));
  }, [mode, tourTitle]);

  function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: 'user', content: trimmed },
      {
        role: 'assistant',
        content:
          mode === 'image'
            ? 'Got it. Once AI image editing is connected, this request can be applied to the tour cover image.'
            : 'Got it. Once AI intro editing is connected, this request can be applied to the tour title and description.',
      },
    ]);
    setInput('');
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(
    nextMode: TourAiPanelMode,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    const startX = dragStartX.current;
    dragStartX.current = null;
    if (startX === null) return;

    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) < 24) return;

    handledDrag.current = true;
    if (deltaX < 0) {
      onModeChange(nextMode);
      onOpenChange(true);
      return;
    }

    onOpenChange(false);
  }

  function handleTabClick(nextMode: TourAiPanelMode) {
    if (handledDrag.current) {
      handledDrag.current = false;
      return;
    }

    if (open && nextMode === mode) {
      onOpenChange(false);
      return;
    }

    onModeChange(nextMode);
    onOpenChange(true);
  }

  return (
    <aside
      className={`stq-riddle-ai-panel${open ? ' stq-riddle-ai-panel--open' : ''}`}
      role="dialog"
      aria-modal={open}
      aria-label="AI tour editor"
      aria-hidden={!open}
    >
      <div className="stq-riddle-ai-tabs" aria-label="AI editor modes">
        {TOUR_AI_PANEL_MODES.map((item) => (
          <button
            key={item.mode}
            type="button"
            className={[
              'stq-riddle-ai-tab',
              `stq-riddle-ai-tab--${item.mode}`,
              item.mode === mode ? 'stq-riddle-ai-tab--active' : '',
            ].join(' ')}
            onClick={() => handleTabClick(item.mode)}
            onPointerDown={handlePointerDown}
            onPointerUp={(event) => handlePointerUp(item.mode, event)}
            aria-label={`${open && item.mode === mode ? 'Close' : 'Open'} ${item.label}`}
            aria-expanded={open && item.mode === mode}
          >
            <Icon name={item.icon} size={18} />
          </button>
        ))}
      </div>
      <header className="stq-riddle-ai-header">
        <button
          type="button"
          className="stq-riddle-ai-icon-btn"
          onClick={() => onOpenChange(false)}
          aria-label="Close AI tour editor"
        >
          <Icon name="x" size={18} />
        </button>
        <div className="stq-riddle-ai-mode-icon" aria-hidden>
          <Icon name={activeMode.icon} size={17} />
        </div>
        <div>
          <span>{modeLabel(mode)}</span>
          <strong>{tourTitle}</strong>
        </div>
        <span className="stq-riddle-ai-status">Soon</span>
      </header>

      <div className="stq-riddle-ai-thread">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`stq-riddle-ai-bubble stq-riddle-ai-bubble--${message.role}`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form
        className="stq-riddle-ai-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (recording) stopDictation();
          sendMessage();
        }}
      >
        <button
          type="button"
          className={`stq-riddle-ai-mic${recording ? ' stq-riddle-ai-mic--rec' : ''}`}
          onClick={recording ? stopDictation : startDictation}
          aria-label={recording ? 'Stop voice input' : 'Start voice input'}
          aria-pressed={recording}
          disabled={!supportsSpeech && !recording}
        >
          <Icon name="mic" size={17} />
        </button>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            mode === 'image'
              ? 'Describe cover image changes...'
              : 'Describe title or description changes...'
          }
          className="stq-riddle-ai-input"
        />
        <button
          type="submit"
          className="stq-riddle-ai-send"
          aria-label="Send message"
          disabled={!input.trim()}
        >
          <Icon name="chevron-right" size={18} />
        </button>
      </form>
    </aside>
  );
}

function initialMessages(mode: TourAiPanelMode, tourTitle: string): ChatMessage[] {
  return [
    {
      role: 'assistant',
      content:
        mode === 'image'
          ? `Tell me what kind of cover image should represent "${tourTitle}". Voice input works here too.`
          : `Tell me how the title or description for "${tourTitle}" should change. Voice input works here too.`,
    },
    {
      role: 'assistant',
      content:
        mode === 'image'
          ? 'AI image editing is not implemented yet, but this chat will collect the request.'
          : 'AI intro editing is not implemented yet, but this chat will collect the request.',
    },
  ];
}

function modeLabel(mode: TourAiPanelMode) {
  if (mode === 'image') return 'AI cover image';
  return 'AI tour intro';
}
