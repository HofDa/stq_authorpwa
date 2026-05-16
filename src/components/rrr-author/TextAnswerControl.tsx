import { TextAnswerVisual } from '@/components/rrr-runtime/TextAnswerVisual';

const LABELS = {
  eyebrow: 'Texteingabe',
  title: 'Textantwort testen',
  placeholder: 'Antwort eingeben',
  helper: 'Diese Eingabe wird nur für die Autoren-Vorschau verwendet.',
  fillExpected: 'Richtige Antwort einsetzen',
  clear: 'Leeren',
} as const;

interface TextAnswerControlProps {
  value: string;
  acceptedAnswers: string[];
  onValueChange: (value: string) => void;
}

export function TextAnswerControl({
  value,
  acceptedAnswers,
  onValueChange,
}: TextAnswerControlProps) {
  const expectedAnswer = acceptedAnswers.find(
    (answer) => answer.trim().length > 0,
  );

  return (
    <div className="stq-rrr-text-answer-control">
      <TextAnswerVisual
        value={value}
        onValueChange={onValueChange}
        title={LABELS.title}
        eyebrow={LABELS.eyebrow}
        placeholder={LABELS.placeholder}
        helperText={LABELS.helper}
      />

      <div className="stq-rrr-guide__choice">
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={() => expectedAnswer && onValueChange(expectedAnswer)}
          disabled={!expectedAnswer}
        >
          {LABELS.fillExpected}
        </button>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() => onValueChange('')}
          disabled={!value}
        >
          {LABELS.clear}
        </button>
      </div>
    </div>
  );
}
