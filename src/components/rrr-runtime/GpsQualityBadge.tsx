import {
  getGpsQuality,
  recommendGpsRadius,
  type GpsQuality,
} from '@/rrr-sensors';

export interface GpsQualityBadgeProps {
  accuracyMeters?: number;
  configuredRadiusMeters?: number;
}

const QUALITY_LABELS: Record<GpsQuality, string> = {
  good: 'GPS gut',
  ok: 'GPS ok',
  poor: 'GPS schwach',
  unknown: 'GPS unbekannt',
};

const QUALITY_MESSAGES: Record<GpsQuality, string> = {
  good: 'Die aktuelle Genauigkeit reicht für enge GPS-Radien.',
  ok: 'Die aktuelle Genauigkeit ist brauchbar. Plane etwas Reserve ein.',
  poor: 'Die aktuelle Genauigkeit schwankt stark. Ein größerer Radius ist sinnvoll.',
  unknown: 'Noch keine GPS-Genauigkeit verfügbar.',
};

export function GpsQualityBadge({
  accuracyMeters,
  configuredRadiusMeters,
}: GpsQualityBadgeProps) {
  const quality = getGpsQuality(accuracyMeters);
  const suggestedRadius = recommendGpsRadius(accuracyMeters);
  const radiusTooTight =
    isFinitePositiveNumber(configuredRadiusMeters) &&
    isFinitePositiveNumber(accuracyMeters) &&
    configuredRadiusMeters < accuracyMeters;

  return (
    <section
      className={`stq-gps-quality stq-gps-quality--${quality}`}
      aria-label="GPS quality"
    >
      <div className="stq-gps-quality__header">
        <strong>{QUALITY_LABELS[quality]}</strong>
        <span>{formatMeters(accuracyMeters)}</span>
      </div>
      <p>{QUALITY_MESSAGES[quality]}</p>
      <dl className="stq-gps-quality__facts">
        <div>
          <dt>Empfohlener Radius</dt>
          <dd>{suggestedRadius} m</dd>
        </div>
        {configuredRadiusMeters !== undefined && (
          <div>
            <dt>Konfigurierter Radius</dt>
            <dd>{Math.round(configuredRadiusMeters)} m</dd>
          </div>
        )}
      </dl>
      {radiusTooTight && (
        <p className="stq-gps-quality__warning">
          Der konfigurierte Radius ist kleiner als die aktuelle GPS-Genauigkeit.
          Das kann im Feld unzuverlässig wirken.
        </p>
      )}
    </section>
  );
}

function formatMeters(value: number | undefined): string {
  return isFinitePositiveNumber(value) ? `${Math.round(value)} m` : 'keine Messung';
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
