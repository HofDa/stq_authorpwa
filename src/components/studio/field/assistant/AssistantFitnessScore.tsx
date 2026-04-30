interface AssistantFitnessScoreProps {
  percent: number;
}

export function AssistantFitnessScore({ percent }: AssistantFitnessScoreProps) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  const tone =
    percent === 100
      ? 'var(--stq-success)'
      : percent >= 75
        ? 'var(--stq-success)'
        : percent >= 25
          ? 'var(--stq-amber)'
          : 'var(--stq-error)';

  return (
    <div className="stq-assistant-score" style={{ color: tone }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="rgba(35,25,25,0.08)"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <span>{percent}</span>
    </div>
  );
}
