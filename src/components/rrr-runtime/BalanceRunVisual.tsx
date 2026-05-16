interface BalanceRunVisualProps {
  distanceMeters: number;
  successRadiusMeters: number;
  elapsedMs: number;
  timeLimitMs: number;
  tiltX: number;
  tiltY: number;
  maxTiltDegrees: number;
  running?: boolean;
  failed?: boolean;
  complete?: boolean;
}

export function BalanceRunVisual({
  distanceMeters,
  successRadiusMeters,
  elapsedMs,
  timeLimitMs,
  tiltX,
  tiltY,
  maxTiltDegrees,
  running = false,
  failed = false,
  complete = false,
}: BalanceRunVisualProps) {
  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);
  const routeProgress = clamp(
    1 - distanceMeters / Math.max(successRadiusMeters * 8, 80),
    0,
    1,
  );
  const tiltMagnitude = Math.hypot(tiltX, tiltY);
  const balanceOk = tiltMagnitude <= maxTiltDegrees;
  const bubbleX = clamp((tiltY / maxTiltDegrees) * 42, -42, 42);
  const bubbleY = clamp((tiltX / maxTiltDegrees) * 42, -42, 42);

  return (
    <section
      className={[
        'stq-rrr-balance-run',
        running ? 'stq-rrr-balance-run--running' : '',
        failed ? 'stq-rrr-balance-run--failed' : '',
        complete ? 'stq-rrr-balance-run--complete' : '',
        balanceOk ? 'stq-rrr-balance-run--balanced' : 'stq-rrr-balance-run--tilted',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Balance-Lauf"
    >
      <div className="stq-rrr-balance-run__level" aria-hidden>
        <span className="stq-rrr-balance-run__target-zone" />
        <span
          className="stq-rrr-balance-run__bubble"
          style={{
            transform: `translate(calc(-50% + ${bubbleX}%), calc(-50% + ${bubbleY}%))`,
          }}
        />
      </div>

      <div className="stq-rrr-balance-run__route">
        <span className="stq-rrr-balance-run__route-label">Start</span>
        <div className="stq-rrr-balance-run__track" aria-hidden>
          <span style={{ width: `${Math.round(routeProgress * 100)}%` }} />
        </div>
        <span className="stq-rrr-balance-run__route-label">Ziel</span>
      </div>

      <dl className="stq-rrr-balance-run__stats">
        <div>
          <dt>Distanz</dt>
          <dd>{formatMeters(distanceMeters)}</dd>
        </div>
        <div>
          <dt>Zeit</dt>
          <dd>{formatSeconds(remainingMs)}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>
            {Math.round(tiltMagnitude)}° / {Math.round(maxTiltDegrees)}°
          </dd>
        </div>
      </dl>
    </section>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatMeters(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`;
  }
  return `${Math.round(value)} m`;
}

function formatSeconds(value: number): string {
  return `${Math.ceil(value / 1000)} s`;
}
