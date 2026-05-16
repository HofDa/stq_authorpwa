interface ProximityRadarVisualProps {
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  distanceMeters: number;
  successRadiusMeters: number;
  radarRangeMeters?: number;
}

export function ProximityRadarVisual({
  currentLat,
  currentLng,
  targetLat,
  targetLng,
  distanceMeters,
  successRadiusMeters,
  radarRangeMeters,
}: ProximityRadarVisualProps) {
  const rangeMeters =
    radarRangeMeters ?? Math.max(successRadiusMeters * 5, 75);
  const bearing = bearingDegrees(currentLat, currentLng, targetLat, targetLng);
  const visibleInsideRadar = distanceMeters <= rangeMeters;
  const targetDistancePercent = visibleInsideRadar
    ? clamp(distanceMeters / rangeMeters, 0.08, 0.88)
    : 0.96;
  const targetStyle = polarToStyle(bearing, targetDistancePercent);
  const successDiameterPercent = clamp(
    (successRadiusMeters / rangeMeters) * 100 * 2,
    14,
    82,
  );

  return (
    <section className="stq-rrr-radar" aria-label="Zielradar">
      <div className="stq-rrr-radar__screen">
        <span className="stq-rrr-radar__sweep" aria-hidden />
        <span
          className="stq-rrr-radar__success-zone"
          style={{
            width: `${successDiameterPercent}%`,
            height: `${successDiameterPercent}%`,
          }}
          aria-hidden
        />
        <span className="stq-rrr-radar__player" aria-hidden />
        <span
          className={
            visibleInsideRadar
              ? 'stq-rrr-radar__target'
              : 'stq-rrr-radar__target stq-rrr-radar__target--edge'
          }
          style={targetStyle}
          aria-hidden
        />
      </div>
      <dl className="stq-rrr-radar__stats">
        <div>
          <dt>Distanz</dt>
          <dd>{formatMeters(distanceMeters)}</dd>
        </div>
        <div>
          <dt>Zielradius</dt>
          <dd>{formatMeters(successRadiusMeters)}</dd>
        </div>
        <div>
          <dt>Radar</dt>
          <dd>{formatMeters(rangeMeters)}</dd>
        </div>
      </dl>
    </section>
  );
}

function polarToStyle(degrees: number, radius: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  const x = 50 + Math.cos(radians) * radius * 50;
  const y = 50 + Math.sin(radians) * radius * 50;
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${degrees}deg)`,
  };
}

function bearingDegrees(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const startLat = toRadians(fromLat);
  const endLat = toRadians(toLat);
  const lngDelta = toRadians(toLng - fromLng);
  const y = Math.sin(lngDelta) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(lngDelta);
  return normalizeDegrees((Math.atan2(y, x) * 180) / Math.PI);
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
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
