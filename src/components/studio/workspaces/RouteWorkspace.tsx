import { getTourTitleLabel } from '@/utils/localizedContent';
import { calculateRouteLengthMeters } from '@/map/routePlanning';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { DeviceMockup } from '../DeviceMockup';
import { Icon } from '../Icon';
import type { BaseWorkspaceProps } from './workspaceTypes';

type Props = BaseWorkspaceProps;

const PIN_POSITIONS = [
  { left: 36, top: 36 },
  { left: 58, top: 44 },
  { left: 44, top: 58 },
  { left: 67, top: 64 },
  { left: 31, top: 49 },
  { left: 74, top: 52 },
];

export function RouteWorkspace({ draft, locale }: Props) {
  const { t } = useEditorLanguage();
  const routeLength = calculateRouteLengthMeters(draft.recordedRoute);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <DeviceMockup label={t('studio.appPreview')} detail={t('workflow.route')}>
        <div className="stq-route-phone">
          <div className="stq-map-phone__bg" aria-hidden>
            <span className="stq-map-phone__road stq-map-phone__road--a" />
            <span className="stq-map-phone__road stq-map-phone__road--b" />
            <span className="stq-map-phone__road stq-map-phone__road--c" />
          </div>
          <svg
            className="stq-route-phone__line"
            viewBox="0 0 402 870"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M108 286 C156 340 228 314 272 386 S260 556 322 610" />
          </svg>

          <div className="stq-map-phone__top">
            <button type="button" aria-label={t('studio.back')}>
              <Icon name="chevron-left" size={16} />
            </button>
            <span>{getTourTitleLabel(draft.tour, locale, t('studio.untitledTour'))}</span>
          </div>

          <div className="stq-route-phone__stats">
            <span>{t('workflow.route')}</span>
            <strong>{formatDistance(routeLength)}</strong>
            <small>
              {draft.stations.length}{' '}
              {stationCountLabel(draft.stations.length, t)} ·{' '}
              {draft.recordedRoute.length} {t('studio.points')}
            </small>
          </div>

          {draft.stations.map((station, index) => {
            const position = PIN_POSITIONS[index % PIN_POSITIONS.length];
            return (
              <div
                key={station.id}
                className="stq-route-phone__stop"
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
              >
                <span>{station.number}</span>
              </div>
            );
          })}

          <div className="stq-map-phone__zoom" aria-hidden>
            <button type="button">+</button>
            <button type="button">−</button>
          </div>

          <div className="stq-route-phone__sheet">
            <div className="stq-map-phone__sheet-handle" />
            <div className="stq-map-phone__sheet-eyebrow">{t('workflow.route')}</div>
            <h2>{t('studio.checkRoute')}</h2>
            <p>{t('studio.checkRouteCopy')}</p>
          </div>
        </div>
      </DeviceMockup>
    </div>
  );
}

function stationCountLabel(
  count: number,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  return count === 1 ? t('studio.station') : t('studio.stations');
}

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
