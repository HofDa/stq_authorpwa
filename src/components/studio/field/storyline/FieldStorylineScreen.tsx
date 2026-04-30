import { useEffect, useRef, useState } from 'react';
import type { Locale, StorylineMessage, TourDraft } from '@/schema';
import { renderStorylineMarkdown } from './storylineMarkdown';
import { SUGGESTED_STORYLINE_PROMPTS } from './storylinePrompts';
import { synthesizeStorylineReply } from './storylineReply';
import { StorylineInputBar } from './StorylineInputBar';
import { StorylineThread } from './StorylineThread';
import { StorylineTopBar } from './StorylineTopBar';
import { useBodyScrollLock } from './useBodyScrollLock';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  onClose: () => void;
}

/**
 * Conversational editor for the tour-wide storyline. Persists both the
 * chat thread and a derived markdown document on `draft.storyline`. The
 * markdown is injected into the per-station assistant context so OpenClaw
 * stays consistent with the tour's narrative arc.
 */
export function FieldStorylineScreen({
  draft,
  locale,
  onChange,
  onClose,
}: Props) {
  useBodyScrollLock();

  const messages = draft.storyline?.chat ?? [];
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const tourTitle = draft.tour[locale].title || 'this tour';

  const { recording, supportsSpeech, startDictation, stopDictation } =
    useSpeechDictation({
      locale,
      onTranscript: setInput,
    });

  // Seed the very first assistant message so the screen never starts empty.
  // The updater re-checks previous state, making this safe under React StrictMode.
  useEffect(() => {
    if (messages.length > 0) return;

    onChange((prev) => {
      if ((prev.storyline?.chat.length ?? 0) > 0) return prev;

      const now = Date.now();
      const seedAssistant: StorylineMessage = {
        role: 'assistant',
        content: `I'll help you shape an overarching storyline for ${tourTitle}. The clearer this draft, the better every per-station AI call will be downstream.`,
        ts: now,
      };
      const seedFollowUp: StorylineMessage = {
        role: 'assistant',
        content:
          'Tell me about the tour you imagine. We’ll find the arc together — start anywhere:',
        ts: now + 1,
      };

      return {
        ...prev,
        storyline: {
          markdown: prev.storyline?.markdown ?? '',
          updatedAt: prev.storyline?.updatedAt ?? 0,
          chat: [seedAssistant, seedFollowUp],
        },
      };
    });
  }, [messages.length, onChange, tourTitle]);

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
    // Local mock response. Replace with a streaming endpoint later without
    // changing the presentation components.
    const reply = synthesizeStorylineReply(trimmed, messages.length);
    window.setTimeout(() => {
      appendMessage({ role: 'assistant', content: reply, ts: Date.now() });
    }, 250);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Storyline draft"
      className="stq-storyline-screen"
    >
      <StorylineTopBar tourTitle={tourTitle} onClose={onClose} />

      <StorylineThread
        messages={messages}
        scrollRef={scrollRef}
        suggestedPrompts={SUGGESTED_STORYLINE_PROMPTS}
        onSelectPrompt={send}
      />

      <StorylineInputBar
        input={input}
        recording={recording}
        supportsSpeech={supportsSpeech}
        onInputChange={setInput}
        onSubmit={() => send(input)}
        onStartDictate={startDictation}
        onStopDictate={stopDictation}
      />
    </div>
  );
}
