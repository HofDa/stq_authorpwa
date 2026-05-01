import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import type { AuthorMapBasemapKey } from '@/components/map/mapTypes';
import { FieldInspector } from '@/author/FieldInspector';
import { FieldMapSection } from './FieldMapSection';
import { FieldStationList } from './FieldStationList';
import type { CurrentGps, FieldView } from './types';

interface Props {
  draft: TourDraft;
  view: FieldView;
  selected: RiddleEntry | null;
  locale: Locale;
  gps: CurrentGps | null;
  gpsLive: boolean;
  gpsError: string | null;
  tourLabel: string;
  basemap: AuthorMapBasemapKey;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  onSelectStation: (id: string) => void;
  onSelectStationFromList: (id: string) => void;
  onToggleGps: () => void;
  onEditStation: () => void;
  onPinHere: () => void;
  onPhotoCaptured: (blobId: string) => void;
  onAddStationAt: (coordinate: { lat: number; lng: number }) => void;
  onChangeBasemap: (key: AuthorMapBasemapKey) => void;
  authorMode: boolean;
  onAuthorModeChange: (enabled: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onBackToList: () => void;
}

export function FieldModeContent({
  draft,
  view,
  selected,
  locale,
  gps,
  gpsLive,
  gpsError,
  tourLabel,
  basemap,
  onChange,
  onSelectStation,
  onSelectStationFromList,
  onToggleGps,
  onEditStation,
  onPinHere,
  onPhotoCaptured,
  onAddStationAt,
  onChangeBasemap,
  authorMode,
  onAuthorModeChange,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onBackToList,
}: Props) {
  return (
    <div className="stq-field-body">
      {(view === 'map' || (view === 'station' && selected)) && (
        <FieldMapSection
          draftId={draft.draftId}
          stations={draft.stations}
          selected={selected}
          gps={gps}
          gpsLive={gpsLive}
          gpsError={gpsError}
          tourLabel={tourLabel}
          locale={locale}
          basemap={basemap}
          onSelectStation={onSelectStation}
          onToggleGps={onToggleGps}
          onEditStation={onEditStation}
          onPinHere={onPinHere}
          onPhotoCaptured={onPhotoCaptured}
          onAddStationAt={onAddStationAt}
          onChangeBasemap={onChangeBasemap}
          hideSelectedCard={view === 'station'}
        />
      )}

      {view === 'station' && selected && (
        <div className="stq-field-riddle-overlay">
          <FieldInspector
            draft={draft}
            station={selected}
            locale={locale}
            authorMode={authorMode}
            onAuthorModeChange={onAuthorModeChange}
            onBack={onBackToList}
            onPrev={onPrev}
            onNext={onNext}
            isFirst={isFirst}
            isLast={isLast}
            presentation="mapOverlay"
            onChange={onChange}
          />
        </div>
      )}

      {view === 'station' && !selected && <FieldModeEmptyState />}

      {view === 'list' && (
        <FieldStationList
          stations={draft.stations}
          locale={locale}
          selectedId={selected?.id ?? null}
          onSelect={onSelectStationFromList}
        />
      )}
    </div>
  );
}

function FieldModeEmptyState() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        color: 'var(--stq-text-mute)',
        fontSize: 13,
        textAlign: 'center',
        padding: 20,
      }}
    >
      Add a station from the list to start editing in the field.
    </div>
  );
}
