import { useRef } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { FieldInspector } from '@/author/FieldInspector';

export type BottomSheetState = 'closed' | 'collapsed' | 'expanded';

interface Props {
  state: BottomSheetState;
  draft: TourDraft;
  station: RiddleEntry | null;
  locale: Locale;
  authorMode: boolean;
  solved: boolean;
  isFirst: boolean;
  isLast: boolean;
  onStateChange: (state: BottomSheetState) => void;
  onAuthorModeChange: (enabled: boolean) => void;
  onStationSolved: (stationId: string) => void;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDeleteStation?: (stationId: string) => void;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function StationBottomSheet({
  state,
  draft,
  station,
  locale,
  authorMode,
  solved,
  isFirst,
  isLast,
  onStateChange,
  onAuthorModeChange,
  onStationSolved,
  onBack,
  onPrev,
  onNext,
  onDeleteStation,
  onChange,
}: Props) {
  const dragStartY = useRef<number | null>(null);
  const handledDrag = useRef(false);

  if (!station || state === 'closed') return null;

  function handleSheetHandleClick() {
    if (handledDrag.current) {
      handledDrag.current = false;
      return;
    }

    onStateChange(state === 'expanded' ? 'collapsed' : 'expanded');
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const startY = dragStartY.current;
    dragStartY.current = null;
    if (startY === null) return;

    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) < 28) {
      onStateChange(state === 'expanded' ? 'collapsed' : 'expanded');
      return;
    }

    handledDrag.current = true;
    onStateChange(deltaY > 0 ? 'closed' : 'expanded');
  }

  return (
    <section
      className={`stq-station-bottom-sheet stq-station-bottom-sheet--${state}`}
      aria-label="Station"
    >
      <div className="stq-station-sheet-toolbar">
        <button
          type="button"
          className="stq-station-sheet-handle"
          aria-label={state === 'expanded' ? 'Collapse station sheet' : 'Close station sheet'}
          onClick={handleSheetHandleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
      </div>
      <div className="stq-station-sheet-scroll">
        <FieldInspector
          draft={draft}
          station={station}
          locale={locale}
          authorMode={authorMode}
          solved={solved}
          onAuthorModeChange={onAuthorModeChange}
          onStationSolved={onStationSolved}
          onBack={onBack}
          onPrev={onPrev}
          onNext={onNext}
          onDeleteStation={onDeleteStation}
          isFirst={isFirst}
          isLast={isLast}
          presentation="mapOverlay"
          onChange={onChange}
        />
      </div>
    </section>
  );
}
