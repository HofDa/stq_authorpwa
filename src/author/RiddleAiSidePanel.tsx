import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/schema';
import { Icon } from '@/components/studio/Icon';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export type RiddleAiPanelMode =
  | 'image'
  | 'icon'
  | 'story'
  | 'facts'
  | 'riddle'
  | 'success';

interface Props {
  locale: Locale;
  stationTitle: string;
  mode: RiddleAiPanelMode;
  onModeChange: (mode: RiddleAiPanelMode) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AI_PANEL_MODES: Array<{
  mode: RiddleAiPanelMode;
  icon: 'wand' | 'sparkles' | 'layers' | 'puzzle' | 'check-circle' | 'map-pin';
  label: string;
}> = [
  { mode: 'icon', icon: 'map-pin', label: 'Icon AI' },
  { mode: 'image', icon: 'wand', label: 'Image AI' },
  { mode: 'story', icon: 'sparkles', label: 'Story AI' },
  { mode: 'facts', icon: 'layers', label: 'Facts AI' },
  { mode: 'riddle', icon: 'puzzle', label: 'Riddle AI' },
  { mode: 'success', icon: 'check-circle', label: 'Success AI' },
];

export function RiddleAiSidePanel({
  locale,
  stationTitle,
  mode,
  onModeChange,
  open,
  onOpenChange,
}: Props) {
  const [input, setInput] = useState('');
  const dragStartX = useRef<number | null>(null);
  const handledDrag = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages(mode, stationTitle),
  );
  const { recording, supportsSpeech, startDictation, stopDictation } =
    useSpeechDictation({
      locale,
      onTranscript: setInput,
    });
  const activeMode = AI_PANEL_MODES.find((item) => item.mode === mode) ?? AI_PANEL_MODES[0];

  useEffect(() => {
    setInput('');
    setMessages(initialMessages(mode, stationTitle));
  }, [mode, stationTitle]);

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
            ? 'Got it. Once AI image editing is connected, this request can be applied to the station image.'
            : mode === 'icon'
              ? 'Got it. Once AI icon generation is connected, this request can suggest a station icon and marker color.'
            : mode === 'story'
              ? 'Got it. Once AI story editing is connected, this request can be applied to the story section.'
              : mode === 'facts'
                ? 'Got it. Once AI fact editing is connected, this request can be applied to the background section.'
                : mode === 'riddle'
                  ? 'Got it. Once AI riddle editing is connected, this request can be applied to the riddle section.'
                  : 'Got it. Once AI success-message editing is connected, this request can be applied to the success section.',
      },
    ]);
    setInput('');
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(
    nextMode: RiddleAiPanelMode,
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

  function handleTabClick(nextMode: RiddleAiPanelMode) {
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
      aria-label="AI image editor"
      aria-hidden={!open}
    >
      <div className="stq-riddle-ai-tabs" aria-label="AI editor modes">
        {AI_PANEL_MODES.map((item) => (
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
          aria-label="Close AI image editor"
        >
          <Icon name="x" size={18} />
        </button>
        <div className="stq-riddle-ai-mode-icon" aria-hidden>
          <Icon name={activeMode.icon} size={17} />
        </div>
        <div>
          <span>{modeLabel(mode)}</span>
          <strong>{stationTitle}</strong>
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
              ? 'Describe image changes...'
              : mode === 'icon'
                ? 'Describe the station icon...'
              : mode === 'story'
                ? 'Describe story changes...'
                : mode === 'facts'
                  ? 'Describe background/fact changes...'
                  : mode === 'riddle'
                    ? 'Describe riddle changes...'
                    : 'Describe success message changes...'
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

function initialMessages(mode: Props['mode'], stationTitle: string): ChatMessage[] {
  return [
    {
      role: 'assistant',
      content:
        mode === 'image'
          ? `Tell me what you want to change about the image for "${stationTitle}". Voice input works here too.`
          : mode === 'icon'
            ? `Tell me what kind of station icon should represent "${stationTitle}". Voice input works here too.`
          : mode === 'story'
            ? `Tell me what you want to change in the story text for "${stationTitle}". Voice input works here too.`
            : mode === 'facts'
              ? `Tell me what you want to change in the background facts for "${stationTitle}". Voice input works here too.`
              : mode === 'riddle'
                ? `Tell me what you want to change in the riddle for "${stationTitle}". Voice input works here too.`
                : `Tell me what you want to change in the success message for "${stationTitle}". Voice input works here too.`,
    },
    {
      role: 'assistant',
      content:
        mode === 'image'
          ? 'AI image editing is not implemented yet, but this chat will collect the request.'
          : mode === 'icon'
            ? 'AI icon generation is not implemented yet, but this chat will collect icon ideas, style, and color direction.'
          : mode === 'story'
            ? 'AI story editing is not implemented yet, but this chat will collect the request.'
            : mode === 'facts'
              ? 'AI background/fact editing is not implemented yet, but this chat will collect the request.'
              : mode === 'riddle'
                ? 'AI riddle editing is not implemented yet, but this chat will collect the request.'
                : 'AI success-message editing is not implemented yet, but this chat will collect the request.',
    },
  ];
}

function modeLabel(mode: Props['mode']) {
  if (mode === 'image') return 'AI image editor';
  if (mode === 'icon') return 'AI icon helper';
  if (mode === 'story') return 'AI story editor';
  if (mode === 'riddle') return 'AI riddle editor';
  if (mode === 'success') return 'AI success editor';
  return 'AI facts editor';
}
