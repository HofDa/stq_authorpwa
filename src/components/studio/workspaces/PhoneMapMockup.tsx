import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AuthorMap } from '@/components/map/AuthorMap';
import {
  AUTHOR_MAP_BASEMAPS,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapBasemapKey,
  type AuthorMapControlAction,
  type AuthorMapCoordinate,
  type AuthorMapRoute,
  type AuthorMapRoutePointMarker,
} from '@/components/map/mapTypes';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { getStationLocationLabel, getTourTitleLabel } from '@/utils/localizedContent';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { DeviceMockup } from '../DeviceMockup';
import { Icon } from '../Icon';

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };
const STUDIO_MAP_FIT_PADDING: [number, number] = [64, 64];

export interface PhoneMapMockupProps {
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onSelectStation: (id: string) => void;

  /** Detail label shown above the mockup (e.g. "Karte" or "Route"). */
  detail: string;

  /** Optional route polylines to draw on top of the map. */
  routes?: AuthorMapRoute[];

  /** Stations the user can drag (Karte edit mode). Empty if not editable. */
  draggableStationIds?: string[];
  /** Stations that show a delete affordance when in edit mode. */
  deletableStationIds?: string[];
  onDeleteStation?: (stationId: string) => void;
  onStationCoordinateChange?: (
    stationId: string,
    coordinate: AuthorMapCoordinate,
  ) => void;

  /** Right-side toolbar buttons appearing under the edit pill. */
  toolbar?: ReactNode;

  /** Whether to show the basemap (layers) switcher inside the toolbar. */
  showLayersControl?: boolean;

  /** Optional pill button on the top-right (e.g. pen for Karte edit toggle). */
  topRightPill?: ReactNode;
  /** Optional action rendered inside the tour title pill's right slot. */
  titlePillAction?: ReactNode;

  /** If provided, fit the map to these coordinates when fitTrigger changes. */
  fitToCoordinates?: AuthorMapCoordinate[];
  fitTrigger?: string;

  /** Notified whenever the map's viewport center changes (used for "add at center"). */
  onViewportCenterChange?: (center: AuthorMapCoordinate) => void;

  /** Optional bottom sheet content (e.g. route stats). */
  bottomSheet?: ReactNode;

  /**
   * If provided, replaces the default station progress dock at the bottom.
   * Used by the Route workspace to render segment pills (1→2, 2→3, …).
   */
  dockOverride?: ReactNode;
  /** Optional leading action inside the station progress dock. */
  dockLeadingAction?: {
    ariaLabel: string;
    active?: boolean;
    icon: ReactNode;
    onClick: () => void;
  };

  /**
   * Renders a clickable arrow between consecutive station bubbles in the
   * dock. The arrow's "from" is the station immediately to its left.
   * When this prop is set, station bubbles become non-interactive (the
   * arrow is the only selectable element).
   */
  segmentArrows?: {
    selectedFromId: string | null;
    onSelect: (fromStationId: string) => void;
  };

  /** Optional draggable route-point markers passed through to the AuthorMap. */
  routePointMarkers?: AuthorMapRoutePointMarker[];
  onRoutePointCoordinateChange?: (
    routePointId: string,
    coordinate: AuthorMapCoordinate,
  ) => void;

  /** Click anywhere on the map (used for inserting a new route point). */
  onMapClick?: (coordinate: AuthorMapCoordinate) => void;
  onRouteClick?: (routeId: string, coordinate: AuthorMapCoordinate) => void;

  /** Hide the title pill at the top of the phone screen. */
  hideTitlePill?: boolean;
  /** Fired from the back button in the title pill. */
  onTitleBack?: () => void;
  /** Hide the zoom +/− controls overlay. */
  hideZoomControls?: boolean;

  /**
   * Action stack rendered OUTSIDE the phone frame, in the right gutter.
   * Used in desktop layouts to keep the phone screen clean while still
   * surfacing add/delete/route tools beside the mockup.
   */
  desktopActions?: ReactNode;
}

/**
 * Shared iPhone-shaped map mockup used by the Karte (Stations) and Route
 * studio workspaces. Owns the AuthorMap, basemap switcher, zoom controls
 * and station progress dock; route overlays and per-mode toolbars are
 * passed in by the caller.
 */
export function PhoneMapMockup({
  draft,
  locale,
  selectedId,
  onSelectStation,
  detail,
  routes,
  draggableStationIds,
  deletableStationIds,
  onDeleteStation,
  onStationCoordinateChange,
  toolbar,
  showLayersControl = false,
  topRightPill,
  titlePillAction,
  fitToCoordinates,
  fitTrigger,
  onViewportCenterChange,
  bottomSheet,
  dockOverride,
  dockLeadingAction,
  segmentArrows,
  routePointMarkers,
  onRoutePointCoordinateChange,
  onMapClick,
  onRouteClick,
  hideTitlePill = false,
  onTitleBack,
  hideZoomControls = false,
  desktopActions,
}: PhoneMapMockupProps) {
  const { t } = useEditorLanguage();
  const [basemap, setBasemap] = useState<AuthorMapBasemapKey>(
    DEFAULT_AUTHOR_MAP_BASEMAP,
  );
  const [layersOpen, setLayersOpen] = useState(false);
  const [mapControlAction, setMapControlAction] =
    useState<AuthorMapControlAction | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);

  // Enable click-and-drag horizontal scrolling on the dock progress track.
  useEffect(() => {
    const track = dockRef.current;
    if (!track) return;
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      // Don't hijack pointer events that started on an interactive child —
      // capturing them here breaks button clicks (the click target retargets
      // to the track and the button's onClick never fires).
      const target = event.target as Element | null;
      if (target && target.closest('button, a, [role="button"]')) return;
      isDown = true;
      moved = false;
      startX = event.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!isDown) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      try {
        track.releasePointerCapture(event.pointerId);
      } catch {
        /* noop */
      }
      if (moved) {
        const suppress = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
          track.removeEventListener('click', suppress, true);
        };
        track.addEventListener('click', suppress, true);
      }
    };
    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);
    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', onPointerUp);
      track.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  const selected =
    draft.stations.find((station) => station.id === selectedId) ??
    draft.stations[0] ??
    null;

  const stationsWithCoordinates = useMemo(
    () => draft.stations.filter(hasUsableStationCoordinate),
    [draft.stations],
  );
  const mapStations = useMemo(
    () =>
      stationsWithCoordinates.map((station) => ({
        id: station.id,
        number: station.number,
        coordinate: {
          lat: station.position_lat,
          lng: station.position_lng,
        },
        tooltip: getStationLocationLabel(station, locale),
        visual: normalizeStationVisualChoice(station),
        hasSelectedIcon: hasSelectedStationIcon(station),
      })),
    [locale, stationsWithCoordinates],
  );
  const viewportCenter =
    selected && hasUsableStationCoordinate(selected)
      ? { lat: selected.position_lat, lng: selected.position_lng }
      : stationsWithCoordinates[0]
        ? {
            lat: stationsWithCoordinates[0].position_lat,
            lng: stationsWithCoordinates[0].position_lng,
          }
        : DEFAULT_CENTER;

  function dispatchMapControl(type: AuthorMapControlAction['type']) {
    setMapControlAction({ type, nonce: Date.now() });
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <DeviceMockup
        label={t('studio.appPreview')}
        detail={detail}
        contentClassName="stq-ios-device__content--map"
      >
        <div className="stq-phone-map-workspace">
          <AuthorMap
            className="stq-phone-author-map"
            stations={mapStations}
            selectedStationId={selected?.id ?? null}
            basemap={basemap}
            controlAction={mapControlAction}
            controlZoomStep={2.5}
            manualDragPan
            routes={routes}
            routePointMarkers={routePointMarkers}
            onRoutePointCoordinateChange={onRoutePointCoordinateChange}
            onMapClick={onMapClick}
            onRouteClick={onRouteClick}
            draggableStationIds={draggableStationIds}
            deletableStationIds={deletableStationIds}
            onDeleteStation={onDeleteStation}
            onSelectStation={onSelectStation}
            onStationCoordinateChange={onStationCoordinateChange}
            onViewportCenterChange={onViewportCenterChange}
            viewport={{
              center: viewportCenter,
              zoom: 15,
              fitToCoordinates:
                fitToCoordinates && fitToCoordinates.length > 1
                  ? fitToCoordinates
                  : undefined,
              fitPadding: STUDIO_MAP_FIT_PADDING,
              fitMaxZoom: 17,
              fitTrigger,
              panToSelectedStation: false,
            }}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          />

          {!hideTitlePill && (
            <div className="stq-phone-map-title-pill">
              <button
                type="button"
                aria-label={t('studio.back')}
                onClick={onTitleBack}
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="stq-phone-map-title-pill__label">
                {getTourTitleLabel(draft.tour, locale, t('studio.untitledTour'))}
              </span>
              <div className="stq-phone-map-title-pill__action">
                {titlePillAction}
              </div>
            </div>
          )}

          {topRightPill && (
            <div className="stq-phone-map-edit-pill">{topRightPill}</div>
          )}

          {(toolbar || showLayersControl) && (
            <div className="stq-phone-map-tools">
              {toolbar}
              {showLayersControl && (
                <div className="stq-phone-map-layers">
                  <button
                    type="button"
                    onClick={() => setLayersOpen((open) => !open)}
                    aria-label="Layers"
                  >
                    <Icon name="layers" size={15} />
                  </button>
                  {layersOpen && (
                    <div className="stq-phone-map-layers-menu">
                      {(Object.keys(AUTHOR_MAP_BASEMAPS) as AuthorMapBasemapKey[]).map(
                        (key) => (
                          <button
                            key={key}
                            type="button"
                            className={key === basemap ? 'is-active' : ''}
                            onClick={() => {
                              setBasemap(key);
                              setLayersOpen(false);
                            }}
                          >
                            {AUTHOR_MAP_BASEMAPS[key].label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!hideZoomControls && (
            <div className="stq-phone-map-zoom" aria-label="Zoom controls">
              <button
                type="button"
                onClick={() => dispatchMapControl('zoomIn')}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => dispatchMapControl('zoomOut')}
                aria-label="Zoom out"
              >
                −
              </button>
            </div>
          )}

          {bottomSheet}

          {dockOverride ?? (
          <div className="stq-phone-map-dock">
            <div ref={dockRef} className="stq-phone-map-dock-track" role="list">
              <button
                type="button"
                className={`stq-phone-map-dock-info${
                  dockLeadingAction?.active ? ' is-active' : ''
                }`}
                aria-label={dockLeadingAction?.ariaLabel ?? t('studio.tourOverview')}
                aria-pressed={dockLeadingAction?.active || undefined}
                onClick={dockLeadingAction?.onClick}
              >
                {dockLeadingAction?.icon ?? 'i'}
              </button>
              {draft.stations.map((station, index) => {
                const active = station.id === selected?.id;
                const showDelete =
                  deletableStationIds?.includes(station.id) ?? false;
                const arrowMode = Boolean(segmentArrows);
                const nextStation = draft.stations[index + 1];
                const arrowSelected =
                  arrowMode &&
                  nextStation &&
                  segmentArrows!.selectedFromId === station.id;
                return (
                  <Fragment key={station.id}>
                    <span
                      className={`stq-phone-map-progress-item${
                        active && !arrowMode ? ' is-active' : ''
                      }${showDelete ? ' is-editing' : ''}${
                        arrowMode ? ' is-static' : ''
                      }`}
                      role="listitem"
                    >
                      {arrowMode ? (
                        nextStation ? (
                          <button
                            type="button"
                            className={`stq-phone-map-progress-select${
                              arrowSelected ? ' is-active' : ''
                            }`}
                            onClick={() => segmentArrows!.onSelect(station.id)}
                            aria-label={`${t('studio.station')} ${station.number} → ${nextStation.number}`}
                            aria-pressed={arrowSelected || undefined}
                          >
                            <span className="stq-phone-map-progress-number">
                              {station.number}
                            </span>
                            <span
                              className="stq-phone-map-progress-icon"
                              aria-hidden
                            >
                              {stationIconEmoji(station)}
                            </span>
                          </button>
                        ) : (
                          <span
                            className="stq-phone-map-progress-select"
                            aria-label={`${t('studio.station')} ${station.number}`}
                          >
                            <span className="stq-phone-map-progress-number">
                              {station.number}
                            </span>
                            <span
                              className="stq-phone-map-progress-icon"
                              aria-hidden
                            >
                              {stationIconEmoji(station)}
                            </span>
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          className="stq-phone-map-progress-select"
                          onClick={() => onSelectStation(station.id)}
                          aria-label={`${t('studio.station')} ${station.number}`}
                          aria-current={active ? 'step' : undefined}
                        >
                          <span className="stq-phone-map-progress-number">
                            {station.number}
                          </span>
                          <span
                            className="stq-phone-map-progress-icon"
                            aria-hidden
                          >
                            {stationIconEmoji(station)}
                          </span>
                        </button>
                      )}
                      {showDelete && onDeleteStation && (
                        <button
                          type="button"
                          className="stq-phone-map-progress-delete"
                          aria-label={`Delete ${t('studio.station')} ${station.number}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteStation(station.id);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                    {arrowMode && nextStation && (
                      <button
                        type="button"
                        className={`stq-phone-map-segment-arrow${
                          arrowSelected ? ' is-active' : ''
                        }`}
                        aria-label={`${t('studio.station')} ${station.number} → ${nextStation.number}`}
                        aria-pressed={arrowSelected || undefined}
                        onClick={() => segmentArrows!.onSelect(station.id)}
                      >
                        <svg
                          width="22"
                          height="14"
                          viewBox="0 0 22 14"
                          aria-hidden
                        >
                          <path
                            d="M2 7 H17 M13 3 L17 7 L13 11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
            <button
              type="button"
              className="stq-phone-map-dock-next"
              aria-label={t('studio.stations')}
              onClick={() =>
                dockRef.current?.scrollBy({ left: 132, behavior: 'smooth' })
              }
            >
              ›
            </button>
          </div>
          )}
        </div>
      </DeviceMockup>
      {desktopActions && (
        <div className="stq-desktop-map-actions">{desktopActions}</div>
      )}
    </div>
  );
}

export const PHONE_MAP_BASEMAP_OPTIONS = AUTHOR_MAP_BASEMAPS;

function stationIconEmoji(station: RiddleEntry): string {
  switch (station.iconKey) {
    case 'book':
      return '📖';
    case 'cup':
      return '☕';
    case 'cake':
      return '🍰';
    case 'gem':
      return '💎';
    case 'lock':
      return '🔒';
    case 'leaf':
    case 'tree':
      return '🌿';
    case 'camera':
      return '📷';
    case 'map':
      return '🗺️';
    case 'flag':
    default:
      return '📍';
  }
}
