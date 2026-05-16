import { CodeEntryVisual } from '@/components/rrr-runtime/CodeEntryVisual';

const COPY = {
  code_word: {
    eyebrow: 'Codewort',
    title: 'Codewort testen',
    placeholder: 'Codewort eingeben',
    helper: 'Diese Eingabe wird nur für die Autoren-Vorschau verwendet.',
    fillExpected: 'Codewort einsetzen',
  },
  sequential_code: {
    eyebrow: 'Sammelcode',
    title: 'Gesammelten Code testen',
    placeholder: 'Gesammelten Code eingeben',
    helper: 'Diese Eingabe wird nur für die Autoren-Vorschau verwendet.',
    fillExpected: 'Code einsetzen',
  },
} as const;

interface CodeEntryControlProps {
  value: string;
  expectedCode: string;
  variant: keyof typeof COPY;
  onValueChange: (value: string) => void;
}

export function CodeEntryControl({
  value,
  expectedCode,
  variant,
  onValueChange,
}: CodeEntryControlProps) {
  const copy = COPY[variant];
  const trimmedExpected = expectedCode.trim();

  return (
    <div className="stq-rrr-code-entry-control">
      <CodeEntryVisual
        value={value}
        onValueChange={onValueChange}
        title={copy.title}
        eyebrow={copy.eyebrow}
        placeholder={copy.placeholder}
        helperText={copy.helper}
      />

      <div className="stq-rrr-guide__choice">
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={() => trimmedExpected && onValueChange(trimmedExpected)}
          disabled={!trimmedExpected}
        >
          {copy.fillExpected}
        </button>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() => onValueChange('')}
          disabled={!value}
        >
          Leeren
        </button>
      </div>
    </div>
  );
}
