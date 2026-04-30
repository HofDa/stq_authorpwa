import type { LocalAssistantCheck } from '@/assistant/openClaw';

interface AssistantChecksListProps {
  checks: LocalAssistantCheck[];
}

export function AssistantChecksList({ checks }: AssistantChecksListProps) {
  if (checks.length === 0) return null;

  return (
    <div className="stq-assistant-checks">
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--stq-primary)',
          textTransform: 'uppercase',
          padding: '0 4px 6px',
        }}
      >
        What's missing
      </div>
      {checks.map((check) => (
        <div
          key={`${check.level}:${check.title}`}
          className={`stq-assistant-check stq-assistant-check--${check.level}`}
        >
          <div style={{ fontWeight: 700, fontSize: 13 }}>{check.title}</div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--stq-text-mute)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {check.detail}
          </div>
        </div>
      ))}
    </div>
  );
}
