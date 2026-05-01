import { Icon } from '@/components/studio/Icon';

interface Props {
  label: string;
  onEdit: () => void;
  tone?: 'light' | 'dark';
  accent?: 'image' | 'icon' | 'story' | 'facts' | 'riddle' | 'success';
}

export function AuthorToolbar({
  label,
  onEdit,
  tone = 'light',
  accent,
}: Props) {
  return (
    <div
      className={[
        'stq-riddle-author-tools',
        `stq-riddle-author-tools--${tone}`,
        accent ? `stq-riddle-author-tools--${accent}` : '',
      ].join(' ')}
    >
      <button type="button" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Icon name="edit" size={14} />
      </button>
    </div>
  );
}
