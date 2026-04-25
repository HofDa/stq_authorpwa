import type { TourDraft } from '@/schema';
import { FieldAssistantSheet } from './field/FieldAssistantSheet';
import { FieldBottomNav } from './field/FieldBottomNav';
import { FieldHeader } from './field/FieldHeader';
import { FieldModeContent } from './field/FieldModeContent';
import { FieldPreviewPanel } from './field/FieldPreviewPanel';
import { FieldStorylineScreen } from './field/FieldStorylineScreen';
import { useFieldModeState } from './field/useFieldModeState';

interface Props {
  draft: TourDraft;
  initialStationId: string | null;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  onExit: () => void;
  embedded?: boolean;
  exitLabel?: string;
}

export function FieldMode({
  draft,
  initialStationId,
  onChange,
  onExit,
  embedded = false,
  exitLabel = 'Back to studio',
}: Props) {
  const {
    view,
    setView,
    locale,
    setLocale,
    assistantOpen,
    setAssistantOpen,
    storylineOpen,
    setStorylineOpen,
    gpsLive,
    gps,
    gpsError,
    toggleGps,
    selected,
    gpsAccuracy,
    tourLabel,
    selectedLabel,
    isFirst,
    isLast,
    selectStation,
    selectStationFromList,
    goPrev,
    goNext,
    pinSelectedToGps,
    setSelectedPhoto,
    addStationAt,
    basemap,
    setBasemap,
  } = useFieldModeState({
    draft,
    initialStationId,
    onChange,
  });

  return (
    <FieldPreviewPanel
      embedded={embedded}
      exitLabel={exitLabel}
      onExit={onExit}
      gpsLive={gpsLive}
      gpsAccuracy={gpsAccuracy}
    >
      <FieldHeader
        embedded={embedded}
        exitLabel={exitLabel}
        onExit={onExit}
        locale={locale}
        onLocaleChange={setLocale}
        view={view}
        onViewChange={setView}
        tourLabel={tourLabel}
        selectedLabel={selectedLabel}
        storylineExists={Boolean(draft.storyline?.markdown?.trim())}
        onOpenStoryline={() => setStorylineOpen(true)}
      />

      <FieldModeContent
        draft={draft}
        view={view}
        selected={selected}
        locale={locale}
        gps={gps}
        gpsLive={gpsLive}
        gpsError={gpsError}
        tourLabel={tourLabel}
        basemap={basemap}
        onChange={onChange}
        onSelectStation={selectStation}
        onSelectStationFromList={selectStationFromList}
        onToggleGps={toggleGps}
        onEditStation={() => setView('station')}
        onPinHere={pinSelectedToGps}
        onPhotoCaptured={setSelectedPhoto}
        onAddStationAt={addStationAt}
        onChangeBasemap={setBasemap}
      />

      <FieldBottomNav
        isFirst={isFirst}
        isLast={isLast}
        assistantOpen={assistantOpen}
        onPrev={goPrev}
        onNext={goNext}
        onOpenAssistant={() => setAssistantOpen(true)}
      />

      {assistantOpen && (
        <FieldAssistantSheet
          draft={draft}
          locale={locale}
          station={selected ?? undefined}
          onClose={() => setAssistantOpen(false)}
          onSelectStation={selectStation}
        />
      )}

      {storylineOpen && (
        <FieldStorylineScreen
          draft={draft}
          locale={locale}
          onChange={onChange}
          onClose={() => setStorylineOpen(false)}
        />
      )}
    </FieldPreviewPanel>
  );
}
