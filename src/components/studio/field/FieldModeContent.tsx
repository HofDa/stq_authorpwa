import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import type { AuthorMapBasemapKey } from '@/components/map/mapTypes';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';
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
}: Props) {
  return (
    <div className="stq-field-body">
      {view === 'map' && (
        <FieldMapSection
          draftId={draft.draftId}
          stations={draft.stations}
          selected={selected}
          gps={gps}
          gpsLive={gpsLive}
          gpsError={gpsError}
          tourLabel={tourLabel}
          basemap={basemap}
          onSelectStation={onSelectStation}
          onToggleGps={onToggleGps}
          onEditStation={onEditStation}
          onPinHere={onPinHere}
          onPhotoCaptured={onPhotoCaptured}
          onAddStationAt={onAddStationAt}
          onChangeBasemap={onChangeBasemap}
        />
      )}

      {view === 'station' && selected && (
        <div
          className="studio-scroll"
          style={{ height: '100%', overflowY: 'auto' }}
        >
          <InlineStationDrawer
            draft={draft}
            station={selected}
            locale={locale}
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

