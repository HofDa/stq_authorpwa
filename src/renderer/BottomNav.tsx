import { Icon } from '@/components/studio/Icon';

interface Props {
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
}

export function BottomNav({
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
}: Props) {
  return (
    <nav className="stq-riddle-bottom-nav">
      <button type="button" onClick={onPrevious} disabled={previousDisabled}>
        <Icon name="chevron-left" size={18} />
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled}>
        <Icon name="chevron-right" size={18} />
      </button>
    </nav>
  );
}
