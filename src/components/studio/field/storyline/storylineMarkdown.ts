import type { StorylineMessage } from '@/schema';

export function renderStorylineMarkdown(
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
