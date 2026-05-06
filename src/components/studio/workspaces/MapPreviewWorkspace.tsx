import { useRef, useState } from 'react';
import {
  createId,
  emptyStation,
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import type { ContentBlock } from '@/schema/contentBlock';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { getStationLocationLabel, getTourTitleLabel } from '@/utils/localizedContent';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { AuthorMap } from '@/components/map/AuthorMap';
import {
  AUTHOR_MAP_BASEMAPS,
  AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapBasemapKey,
  type AuthorMapCoordinate,
} from '@/components/map/mapTypes';
import { DeviceMockup } from '../DeviceMockup';
import { EditPanel, type EditPanelField } from '../EditPanel';
import { Icon } from '../Icon';

interface Props {
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onSelectStation: (id: string) => void;
  onAddStation: () => void;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
}

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };
const STUDIO_MAP_SELECTION_STYLE = {
  radius: 24,
  color: '#a0463d',
  weight: 3,
  fillOpacity: 0.08,
};

export function MapPreviewWorkspace({
  draft,
  locale,
  selectedId,
  onSelectStation,
  onChange,
}: Props) {
  const { t } = useEditorLanguage();
  const [editingStationId, setEditingStationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [gps, setGps] = useState<AuthorMapCoordinate | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [basemap, setBasemap] = useState<AuthorMapBasemapKey>(
    DEFAULT_AUTHOR_MAP_BASEMAP,
  );
  const [layersOpen, setLayersOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<AuthorMapCoordinate>(DEFAULT_CENTER);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const selected =
    draft.stations.find((station) => station.id === selectedId) ??
    draft.stations[0] ??
    null;
  const editingStation =
    draft.stations.find((station) => station.id === editingStationId) ?? null;

  function patchStation(
    stationId: string,
    updater: (station: RiddleEntry) => RiddleEntry,
  ) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId ? updater(station) : station,
      ),
    }));
  }

  function patchSelectedLocale(
    stationId: string,
    patch: Partial<RiddleEntry[Locale]>,
  ) {
    patchStation(stationId, (station) => ({
      ...station,
      [locale]: {
        ...station[locale],
        ...patch,
      },
    }));
  }

  const editFields = editingStation
    ? getStationEditFields({
        station: editingStation,
        locale,
        t,
        onPatchLocale: (patch) => patchSelectedLocale(editingStation.id, patch),
        onPatchStation: (patch) =>
          patchStation(editingStation.id, (station) => ({
            ...station,
            ...patch,
          })),
      })
    : [];
  const stationsWithCoordinates = draft.stations.filter(hasUsableStationCoordinate);
  const mapStations = stationsWithCoordinates.map((station) => ({
    id: station.id,
    number: station.number,
    coordinate: {
      lat: station.position_lat,
      lng: station.position_lng,
    },
    tooltip: getStationLocationLabel(station, locale),
    visual: normalizeStationVisualChoice(station),
    hasSelectedIcon: hasSelectedStationIcon(station),
  }));
  const viewportCenter =
    selected && hasUsableStationCoordinate(selected)
      ? { lat: selected.position_lat, lng: selected.position_lng }
      : stationsWithCoordinates[0]
        ? {
            lat: stationsWithCoordinates[0].position_lat,
            lng: stationsWithCoordinates[0].position_lng,
          }
        : gps ?? DEFAULT_CENTER;
  const fitPoints = [
    ...stationsWithCoordinates.map((station) => ({
      lat: station.position_lat,
      lng: station.position_lng,
    })),
    ...(gps ? [gps] : []),
  ];

  function requestGps() {
    if (!navigator.geolocation) {
      setGpsError('GPS is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setGps(coordinate);
        setMapCenter(coordinate);
        setGpsError(null);
      },
      (error) => setGpsError(error.message),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 12_000 },
    );
  }

  function addStationAt(coordinate: AuthorMapCoordinate) {
    const stationId = createId('stn');
    onChange((prev) => {
      const station = {
        ...emptyStation(stationId, prev.stations.length + 1),
        position_lat: coordinate.lat,
        position_lng: coordinate.lng,
      };
      return { ...prev, stations: [...prev.stations, station] };
    });
    onSelectStation(stationId);
    setEditingStationId(stationId);
  }

  function addStation() {
    addStationAt(gps ?? mapCenter);
  }

  function deleteStation(stationId: string) {
    const currentIndex = draft.stations.findIndex((station) => station.id === stationId);
    const nextStation =
      draft.stations[currentIndex + 1] ??
      draft.stations[currentIndex - 1] ??
      null;
    onChange((prev) => ({
      ...prev,
      stations: prev.stations
        .filter((station) => station.id !== stationId)
        .map((station, index) => ({ ...station, number: index + 1 })),
    }));
    setEditingStationId((id) => (id === stationId ? null : id));
    if (nextStation) {
      onSelectStation(nextStation.id);
    }
  }

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
      <DeviceMockup label={t('studio.appPreview')} detail={t('studio.map')}>
        <div className="stq-phone-map-workspace">
          <AuthorMap
            stations={mapStations}
            selectedStationId={selected?.id ?? null}
            currentPosition={
              gps
                ? {
                    coordinate: gps,
                  }
                : null
            }
            currentPositionStyle={AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD}
            selectionStyle={STUDIO_MAP_SELECTION_STYLE}
            basemap={basemap}
            draggableStationIds={editMode ? mapStations.map((station) => station.id) : []}
            deletableStationIds={editMode ? mapStations.map((station) => station.id) : []}
            onDeleteStation={deleteStation}
            onSelectStation={onSelectStation}
            onStationCoordinateChange={(stationId, coordinate) =>
              patchStation(stationId, (station) => ({
                ...station,
                position_lat: coordinate.lat,
                position_lng: coordinate.lng,
              }))
            }
            onViewportCenterChange={setMapCenter}
            onMapClick={addStationAt}
            viewport={{
              center: viewportCenter,
              zoom: 15,
              fitToCoordinates: fitPoints.length > 1 ? fitPoints : undefined,
              fitPadding: [40, 40],
              fitMaxZoom: 17,
              fitTrigger: `${fitPoints.length}:${selected?.id ?? 'none'}:${gps?.lat ?? 'no-gps'}`,
              panToSelectedStation: true,
            }}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          />

          <div className="stq-phone-map-title-pill">
            <button type="button" aria-label={t('studio.back')}>
              <Icon name="chevron-left" size={16} />
            </button>
            <span>{getTourTitleLabel(draft.tour, locale, t('studio.untitledTour'))}</span>
          </div>

          <div className="stq-phone-map-edit-pill">
            <button
              type="button"
              aria-label={t('studio.editStation')}
              className={editMode ? 'is-active' : ''}
              onClick={() => setEditMode((value) => !value)}
              aria-pressed={editMode}
            >
              <Icon name="pen" size={13} />
            </button>
          </div>

          <div className="stq-phone-map-tools">
            <button type="button" onClick={requestGps}>
              <Icon name="map-pin" size={15} />
            </button>
            <button type="button" onClick={addStation}>
              <Icon name="plus" size={15} />
            </button>
            <div className="stq-phone-map-layers">
              <button type="button" onClick={() => setLayersOpen((open) => !open)}>
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
          </div>

          {gpsError && <div className="stq-phone-map-error">{gpsError}</div>}

          <div className="stq-phone-map-zoom" aria-hidden>
            <button type="button">+</button>
            <button type="button">−</button>
          </div>

          <div className="stq-phone-map-dock">
            <div ref={dockRef} className="stq-phone-map-dock-track" role="list">
              <button
                type="button"
                className="stq-phone-map-dock-info"
                aria-label={t('studio.tourOverview')}
              >
                i
              </button>
              {draft.stations.map((station) => {
                const active = station.id === selected?.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    className={`stq-phone-map-progress-item${active ? ' is-active' : ''}${
                      editMode ? ' is-editing' : ''
                    }`}
                    onClick={() => onSelectStation(station.id)}
                    aria-label={`${t('studio.station')} ${station.number}`}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span className="stq-phone-map-progress-number">
                      {station.number}
                    </span>
                    <span className="stq-phone-map-progress-icon" aria-hidden>
                      {stationIconEmoji(station)}
                    </span>
                    {editMode && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="stq-phone-map-progress-delete"
                        aria-label={`Delete ${t('studio.station')} ${station.number}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteStation(station.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            deleteStation(station.id);
                          }
                        }}
                      >
                        ×
                      </span>
                    )}
                  </button>
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
        </div>
      </DeviceMockup>

      {editingStation && (
        <EditPanel
          title={`Station ${editingStation.number}`}
          fields={editFields}
          open={editingStationId !== null}
          onClose={() => setEditingStationId(null)}
        />
      )}
    </div>
  );
}

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

function getStationEditFields({
  station,
  locale,
  t,
  onPatchLocale,
  onPatchStation,
}: {
  station: RiddleEntry;
  locale: Locale;
  t: ReturnType<typeof useEditorLanguage>['t'];
  onPatchLocale: (patch: Partial<RiddleEntry[Locale]>) => void;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}): EditPanelField[] {
  const localized = station[locale];
  const hints = [...localized.hints, '', '', ''].slice(0, 3);

  return [
    {
      id: 'station-location',
      label: t('studio.locationTitle'),
      type: 'text',
      value: localized.location,
      placeholder: `${t('studio.station')} ${station.number}`,
      onChange: (value) => onPatchLocale({ location: value }),
    },
    {
      id: 'station-story',
      label: t('studio.stationStory'),
      type: 'textarea',
      value: blocksToText(localized.firstSection),
      placeholder: t('studio.stationStoryPlaceholder'),
      onChange: (value) =>
        onPatchLocale({ firstSection: textToParagraphBlocks(value) }),
    },
    {
      id: 'station-history',
      label: t('studio.historicalContext'),
      type: 'textarea',
      value: blocksToText(localized.historySection),
      placeholder: t('studio.historicalContextPlaceholder'),
      onChange: (value) =>
        onPatchLocale({ historySection: textToParagraphBlocks(value) }),
    },
    {
      id: 'station-riddle',
      label: t('studio.riddle'),
      type: 'textarea',
      value: blocksToText(localized.riddleSection),
      placeholder: t('studio.riddlePlaceholder'),
      onChange: (value) =>
        onPatchLocale({ riddleSection: textToLineBlocks(value) }),
    },
    {
      id: 'station-answer',
      label: t('studio.acceptedAnswers'),
      type: 'text',
      value: formatAcceptedAnswersInput(station.acceptedAnswers[locale]),
      placeholder: t('studio.acceptedAnswersPlaceholder'),
      onChange: (value) =>
        onPatchStation({
          acceptedAnswers: {
            ...station.acceptedAnswers,
            [locale]: parseAcceptedAnswersInput(value),
          },
        }),
    },
    {
      id: 'station-hint-1',
      label: t('studio.hint1'),
      type: 'text',
      value: hints[0],
      placeholder: t('studio.hint1Placeholder'),
      onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 0, value) }),
    },
    {
      id: 'station-hint-2',
      label: t('studio.hint2'),
      type: 'text',
      value: hints[1],
      placeholder: t('studio.hint2Placeholder'),
      onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 1, value) }),
    },
    {
      id: 'station-hint-3',
      label: t('studio.hint3'),
      type: 'text',
      value: hints[2],
      placeholder: t('studio.hint3Placeholder'),
      onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 2, value) }),
    },
  ];
}

function blocksToText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => ('text' in block ? block.text : ''))
    .filter(Boolean)
    .join('\n');
}

function textToParagraphBlocks(value: string): ContentBlock[] {
  return value
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }));
}

function textToLineBlocks(value: string): ContentBlock[] {
  return value
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'line', text }));
}

function replaceHint(hints: string[], index: number, value: string): string[] {
  const next = [...hints];
  next[index] = value;
  return next.map((hint) => hint.trim()).filter(Boolean).slice(0, 3);
}
