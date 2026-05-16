import type { CSSProperties } from 'react';

interface SafeDialVisualProps {
  headingDegrees: number;
  targetDegrees: number;
  tolerance: number;
  unlocked?: boolean;
}

const SAFE_DIAL_TICKS = Array.from({ length: 24 }, (_, index) => index);

export function SafeDialVisual({
  headingDegrees,
  targetDegrees,
  tolerance,
  unlocked = false,
}: SafeDialVisualProps) {
  const heading = normalizeDegrees(headingDegrees);
  const target = normalizeDegrees(targetDegrees);

  return (
    <section
      className={`stq-rrr-safe-dial ${unlocked ? 'stq-rrr-safe-dial--unlocked' : ''}`}
      aria-label="Tresor-Drehrad"
    >
      <div
        className="stq-rrr-safe-dial__face"
        style={
          {
            '--stq-rrr-safe-dial-heading': `${heading}deg`,
            '--stq-rrr-safe-dial-target': `${target}deg`,
          } as SafeDialStyle
        }
      >
        <div className="stq-rrr-safe-dial__target" aria-hidden />
        <div className="stq-rrr-safe-dial__wheel" aria-hidden>
          {SAFE_DIAL_TICKS.map((tick) => (
            <span
              key={tick}
              className={`stq-rrr-safe-dial__tick ${
                tick % 3 === 0 ? 'stq-rrr-safe-dial__tick--major' : ''
              }`}
              style={
                {
                  '--stq-rrr-safe-dial-tick': `${tick * 15}deg`,
                } as SafeDialStyle
              }
            />
          ))}
        </div>
        <div className="stq-rrr-safe-dial__hub">
          <span className="stq-rrr-safe-dial__state">
            {unlocked ? 'OPEN' : 'LOCK'}
          </span>
          <strong>{Math.round(heading)}°</strong>
        </div>
        <span className="stq-rrr-safe-dial__pointer" aria-hidden />
      </div>

      <dl className="stq-rrr-safe-dial__stats">
        <div>
          <dt>Code</dt>
          <dd>{Math.round(target)}°</dd>
        </div>
        <div>
          <dt>Toleranz</dt>
          <dd>+/-{Math.round(Math.max(1, tolerance))}°</dd>
        </div>
      </dl>
    </section>
  );
}

type SafeDialStyle = CSSProperties & Record<string, string | number>;

function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}
