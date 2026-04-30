import { Icon, type IconName } from '@/components/studio/Icon';

interface Props {
  label: string;
  onEdit: () => void;
  onAgent: () => void;
  agentIcon?: IconName;
  tone?: 'light' | 'dark';
}

export function AuthorToolbar({
  label,
  onEdit,
  onAgent,
  agentIcon = 'sparkles',
  tone = 'light',
}: Props) {
  return (
    <div className={`stq-riddle-author-tools stq-riddle-author-tools--${tone}`}>
      <button type="button" onClick={onEdit} aria-label={`Edit ${label}`}>
        <Icon name="edit" size={14} />
      </button>
      <button type="button" onClick={onAgent} aria-label={`Ask agent for ${label}`}>
        <Icon name={agentIcon} size={14} />
      </button>
    </div>
  );
}
