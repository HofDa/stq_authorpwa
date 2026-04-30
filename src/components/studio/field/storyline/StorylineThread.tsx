import type { RefObject } from 'react';
import type { StorylineMessage } from '@/schema';
import { ChatBubble } from './ChatBubble';
import { StorylineSuggestions } from './StorylineSuggestions';

export function StorylineThread({
  messages,
  scrollRef,
  suggestedPrompts,
  onSelectPrompt,
}: {
  messages: StorylineMessage[];
  scrollRef: RefObject<HTMLDivElement>;
  suggestedPrompts: string[];
  onSelectPrompt: (prompt: string) => void;
}) {
  const shouldShowSuggestions =
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    !messages.some((m) => m.role === 'user');

  return (
    <div ref={scrollRef} className="stq-storyline-thread studio-scroll">
      {messages.map((msg, i) => (
        <ChatBubble key={`${msg.ts}-${i}`} message={msg} />
      ))}

      {shouldShowSuggestions && (
        <StorylineSuggestions
          prompts={suggestedPrompts}
          onSelectPrompt={onSelectPrompt}
        />
      )}
    </div>
  );
}
