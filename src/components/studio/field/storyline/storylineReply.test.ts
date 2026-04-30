import { describe, expect, it } from 'vitest';
import { synthesizeStorylineReply } from './storylineReply';

describe('synthesizeStorylineReply', () => {
  it('recognizes language and mystery motifs', () => {
    const reply = synthesizeStorylineReply(
      'A trilingual mystery with a secret clue',
      0,
    );

    expect(reply).toContain('three languages');
    expect(reply).toContain('layered mystery');
  });

  it('keeps later replies shorter and action-oriented', () => {
    const reply = synthesizeStorylineReply('Slow walking with stone details', 4);

    expect(reply).toContain('slow-walking pace');
    expect(reply).toContain('Saved into the storyline');
  });
});
