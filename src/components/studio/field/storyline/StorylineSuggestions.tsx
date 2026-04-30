export function StorylineSuggestions({
  prompts,
  onSelectPrompt,
}: {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="stq-storyline-suggestions">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="stq-storyline-suggestion"
          onClick={() => onSelectPrompt(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
