import { Icon } from '../../Icon';

interface AssistantFitnessCardProps {
  icon: 'camera' | 'map-pin' | 'type' | 'layers';
  label: string;
  value: string;
  done: boolean;
}

export function AssistantFitnessCard({
  icon,
  label,
  value,
  done,
}: AssistantFitnessCardProps) {
  return (
    <div className="stq-assistant-fitness-card">
      <div
        className={`stq-assistant-fitness-icon ${
          done ? 'stq-assistant-fitness-icon--done' : ''
        }`}
        aria-hidden
      >
        <Icon
          name={icon}
          size={16}
          color={done ? 'var(--stq-success)' : 'var(--stq-text-mute)'}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--stq-text-mute)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      </div>
      {done && (
        <Icon name="check-circle" size={16} color="var(--stq-success)" />
      )}
    </div>
  );
}
