import type { StorylineMessage } from '@/schema';
import { Icon } from '../../Icon';

export function ChatBubble({ message }: { message: StorylineMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`stq-storyline-bubble ${
        isUser
          ? 'stq-storyline-bubble--user'
          : 'stq-storyline-bubble--assistant'
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
