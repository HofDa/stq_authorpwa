interface AssistantPromptCardProps {
  stationTitle: string;
}

export function AssistantPromptCard({ stationTitle }: AssistantPromptCardProps) {
  return (
    <div className="stq-assistant-prompt">
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'var(--stq-primary)',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Stand at the spot
      </div>
      <h3
        style={{
          fontFamily: 'var(--stq-font-ui)',
          fontSize: 22,
          fontWeight: 700,
          margin: '8px 0 6px',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          textAlign: 'center',
        }}
      >
        Tell me what you see at {stationTitle}.
      </h3>
      <p
        style={{
          fontSize: 13,
          color: 'var(--stq-text-mute)',
          lineHeight: 1.55,
          margin: 0,
          textAlign: 'center',
        }}
      >
        Hold the mic and talk — what's here, its history, what a tourist should
        notice. I'll split it into story blocks you can edit.
      </p>
    </div>
  );
}
