import type { DirectionHotColdProximity } from '@/rrr/runtime';

interface DirectionHotColdVisualProps {
  proximity: DirectionHotColdProximity;
  deltaDegrees: number;
  headingDegrees: number;
  targetDegrees: number;
  successTolerance: number;
}

const PROXIMITY_STEPS: DirectionHotColdProximity[] = [
  'very_cold',
  'cold',
  'warm',
  'very_warm',
  'correct',
];

const PROXIMITY_LABELS: Record<DirectionHotColdProximity, string> = {
  very_cold: 'Sehr kalt',
  cold: 'Kalt',
  warm: 'Warm',
  very_warm: 'Sehr warm',
  correct: 'Gefunden',
};

export function DirectionHotColdVisual({
  proximity,
  deltaDegrees,
  headingDegrees,
  targetDegrees,
  successTolerance,
}: DirectionHotColdVisualProps) {
  const stepIndex = PROXIMITY_STEPS.indexOf(proximity);
  const heatPercent = Math.round((stepIndex / (PROXIMITY_STEPS.length - 1)) * 100);

  return (
    <section
      className={`stq-rrr-hotcold stq-rrr-hotcold--${proximity}`}
      aria-label="Warm-kalt Richtung"
    >
      <div className="stq-rrr-hotcold__orb" aria-hidden>
        <span className="stq-rrr-hotcold__needle" />
      </div>
      <div className="stq-rrr-hotcold__body">
        <span className="stq-rrr-hotcold__eyebrow">Richtungsnaehe</span>
        <strong>{PROXIMITY_LABELS[proximity]}</strong>
        <small>
          {Math.round(deltaDegrees)} Grad entfernt, Ziel{' '}
          {Math.round(targetDegrees)} Grad
        </small>
      </div>
      <div
        className="stq-rrr-hotcold__meter"
        aria-label={`${heatPercent} Prozent warm`}
      >
        <span style={{ width: `${heatPercent}%` }} />
      </div>
      <dl className="stq-rrr-hotcold__stats">
        <div>
          <dt>Aktuell</dt>
          <dd>{Math.round(headingDegrees)} Grad</dd>
        </div>
        <div>
          <dt>Toleranz</dt>
          <dd>+/-{Math.round(successTolerance)} Grad</dd>
        </div>
      </dl>
    </section>
  );
}
