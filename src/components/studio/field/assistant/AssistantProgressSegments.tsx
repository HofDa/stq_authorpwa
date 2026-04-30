export interface AssistantProgressSegment {
  key: string;
  label: string;
  done: boolean;
}

interface AssistantProgressSegmentsProps {
  segments: AssistantProgressSegment[];
}

export function AssistantProgressSegments({
  segments,
}: AssistantProgressSegmentsProps) {
  return (
    <>
      <div className="stq-assistant-segments" aria-hidden>
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={`stq-assistant-segment ${
              segment.done ? 'stq-assistant-segment--done' : ''
            }`}
          />
        ))}
      </div>
      <div className="stq-assistant-segment-labels" aria-hidden>
        {segments.map((segment) => (
          <span key={segment.key}>{segment.label.toUpperCase()}</span>
        ))}
      </div>
    </>
  );
}
