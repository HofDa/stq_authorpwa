import { Icon } from '../../Icon';

export function StorylineInputBar({
  input,
  recording,
  supportsSpeech,
  onInputChange,
  onSubmit,
  onStartDictate,
  onStopDictate,
}: {
  input: string;
  recording: boolean;
  supportsSpeech: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStartDictate: () => void;
  onStopDictate: () => void;
}) {
  return (
    <form
      className="stq-storyline-input-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (recording) onStopDictate();
        onSubmit();
      }}
    >
      <button
        type="button"
        className={`stq-storyline-mic ${
          recording ? 'stq-storyline-mic--rec' : ''
        }`}
        onClick={recording ? onStopDictate : onStartDictate}
        aria-pressed={recording}
        aria-label={recording ? 'Stop dictation' : 'Dictate message'}
        disabled={!supportsSpeech && !recording}
      >
        <Icon name="mic" size={16} />
      </button>
      <input
        className="stq-storyline-input"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Type, dictate, or tap a suggestion…"
      />
      <button
        type="submit"
        className="stq-storyline-send"
        aria-label="Send"
        disabled={!input.trim()}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </form>
  );
}
