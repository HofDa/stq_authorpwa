import { DIFFICULTY_LEVELS, type DifficultyLevel } from '@/schema';
import { ChoiceChipGroup } from './ChoiceChipGroup';

interface Props {
  value: DifficultyLevel | undefined;
  onChange: (next: DifficultyLevel | undefined) => void;
  ariaLabel?: string;
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  very_easy: 'sehr leicht',
  easy: 'leicht',
  medium: 'mittel',
  hard: 'schwer',
};

const OPTIONS = DIFFICULTY_LEVELS.map((id) => ({
  id,
  label: DIFFICULTY_LABELS[id],
}));

export function DifficultySelector({ value, onChange, ariaLabel }: Props) {
  return (
    <ChoiceChipGroup
      options={OPTIONS}
      value={value}
      onChange={(next) => onChange(next as DifficultyLevel | undefined)}
      allowClear
      ariaLabel={ariaLabel}
    />
  );
}
