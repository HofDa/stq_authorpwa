import { useEffect, useState } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';

interface RrrNumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function RrrNumberField({
  label,
  value,
  onChange,
}: RrrNumberFieldProps) {
  const { t } = useEditorLanguage();
  const externalValue = Number.isFinite(value) ? String(value) : '';
  const [inputValue, setInputValue] = useState(externalValue);
  const parsedValue = Number(inputValue);
  const invalid = inputValue.trim() !== '' && !Number.isFinite(parsedValue);

  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  function handleChange(nextValue: string) {
    setInputValue(nextValue);
    const parsed = Number(nextValue);
    if (nextValue.trim() !== '' && Number.isFinite(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <label className="stq-rrr-field">
      <span>{label}</span>
      <input
        type="number"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        aria-invalid={invalid || undefined}
      />
      {invalid && (
        <small className="stq-rrr-field__hint">
          {t('rrr.editor.number.invalid')}
        </small>
      )}
    </label>
  );
}
