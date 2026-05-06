import type { CSSProperties } from 'react';
import type { PracticalInfo } from '@/schema';

interface Props {
  value: PracticalInfo | undefined;
  onChange: (next: PracticalInfo) => void;
}

interface Toggle {
  id: keyof PracticalInfo;
  label: string;
}

const TOGGLES: Toggle[] = [
  { id: 'strollerFriendly', label: 'Kinderwagen geeignet' },
  { id: 'wheelchairFriendly', label: 'Rollstuhl geeignet' },
  { id: 'dogsAllowed', label: 'Hunde erlaubt' },
  { id: 'publicTransportNearby', label: 'Öffis in der Nähe' },
  { id: 'parkingNearby', label: 'Parkplatz in der Nähe' },
  { id: 'toiletNearby', label: 'WC in der Nähe' },
  { id: 'daylightOnly', label: 'Nur bei Tageslicht' },
  { id: 'availableOffline', label: 'Offline nutzbar' },
  { id: 'requiresInternet', label: 'Internet nötig' },
];

/**
 * Three-state toggle list (ja / nein / nicht gesetzt). Click the active
 * state to clear back to undefined — that distinction matters because
 * "unset" is a real, exportable value (the field hasn't been reviewed).
 */
export function PracticalInfoSelector({ value, onChange }: Props) {
  const current = value ?? {};

  function setFlag(key: keyof PracticalInfo, next: boolean | undefined) {
    const updated: PracticalInfo = { ...current };
    if (next === undefined) {
      delete updated[key];
    } else {
      updated[key] = next;
    }
    onChange(updated);
  }

  return (
    <div role="group" aria-label="Praktische Hinweise" style={listStyle}>
      {TOGGLES.map((toggle) => {
        const flag = current[toggle.id];
        return (
          <div key={toggle.id} style={rowStyle}>
            <span style={labelStyle}>{toggle.label}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <SegButton
                label="Ja"
                active={flag === true}
                onClick={() =>
                  setFlag(toggle.id, flag === true ? undefined : true)
                }
              />
              <SegButton
                label="Nein"
                active={flag === false}
                onClick={() =>
                  setFlag(toggle.id, flag === false ? undefined : false)
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SegButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 7,
        border: `1px solid ${active ? 'var(--stq-primary)' : 'var(--stq-border)'}`,
        background: active
          ? 'var(--stq-primary)'
          : 'var(--stq-author-surface-raised, white)',
        color: active ? 'white' : 'var(--stq-text-mute)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

const listStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '4px 8px',
  borderRadius: 8,
  background: 'var(--stq-author-surface-raised, var(--stq-bg))',
  border: '1px solid var(--stq-border-soft)',
};

const labelStyle: CSSProperties = {
  fontSize: 12.5,
  color: 'var(--stq-text)',
};
