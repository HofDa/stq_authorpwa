export function synthesizeStorylineReply(
  userText: string,
  turnIndex: number,
): string {
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
