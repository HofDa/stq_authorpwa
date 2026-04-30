import { describe, expect, it } from 'vitest';
import type { StorylineMessage } from '@/schema';
import { renderStorylineMarkdown } from './storylineMarkdown';

function msg(role: StorylineMessage['role'], content: string, ts: number) {
  return { role, content, ts } as StorylineMessage;
}

describe('renderStorylineMarkdown', () => {
  it('renders the storyline title and chat turns', () => {
    const markdown = renderStorylineMarkdown('Spatzenpiraten', [
      msg('assistant', 'Tell me about the tour.', 1),
      msg('user', 'It should feel playful.', 2),
    ]);

    expect(markdown).toContain('# Storyline draft — Spatzenpiraten');
    expect(markdown).toContain('**OpenClaw**: Tell me about the tour.');
    expect(markdown).toContain('**Author**: It should feel playful.');
    expect(markdown.endsWith('\n')).toBe(true);
  });
});
