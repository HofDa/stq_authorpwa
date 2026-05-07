import { useRef, useState, type ReactNode } from 'react';

export type MapSheetState = 'closed' | 'collapsed' | 'expanded';

interface Props {
  state: MapSheetState;
  onStateChange: (state: MapSheetState) => void;
  collapsedHeader: ReactNode;
  children: ReactNode;
}

export function MapStationSheet({
  state,
  onStateChange,
  collapsedHeader,
  children,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const sheetHeightAtDragStart = useRef<number>(0);
  const handledDrag = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  if (state === 'closed') return null;

  function handleHandleClick() {
    if (handledDrag.current) {
      handledDrag.current = false;
      return;
    }
    onStateChange(state === 'expanded' ? 'collapsed' : 'expanded');
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    dragStartY.current = event.clientY;
    sheetHeightAtDragStart.current =
      sectionRef.current?.getBoundingClientRect().height ?? 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const startY = dragStartY.current;
    if (startY === null) return;
    const deltaY = event.clientY - startY;
    setDragOffset(Math.max(0, deltaY));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const startY = dragStartY.current;
    dragStartY.current = null;
    setDragOffset(0);
    if (startY === null) return;

    const deltaY = event.clientY - startY;
    const sheetHeight = sheetHeightAtDragStart.current;

    if (Math.abs(deltaY) < 8) {
      onStateChange(state === 'expanded' ? 'collapsed' : 'expanded');
      return;
    }
    handledDrag.current = true;

    if (deltaY > 0 && sheetHeight > 0 && deltaY >= sheetHeight / 2) {
      onStateChange('closed');
      return;
    }
    onStateChange(deltaY < 0 ? 'expanded' : state);
  }

  const sectionStyle =
    dragOffset > 0
      ? {
          transform: `translateY(${dragOffset}px)`,
          transition: 'none',
        }
      : undefined;

  return (
    <section
      ref={sectionRef}
      className={`stq-map-station-sheet stq-map-station-sheet--${state}`}
      aria-label="Station details"
      style={sectionStyle}
    >
      <button
        type="button"
        className="stq-map-station-sheet-handle"
        aria-label={
          state === 'expanded' ? 'Collapse station card' : 'Expand station card'
        }
        onClick={handleHandleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span aria-hidden />
      </button>
      {state === 'collapsed' ? (
        <div
          className="stq-map-station-sheet-collapsed"
          onClick={() => onStateChange('expanded')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onStateChange('expanded');
            }
          }}
        >
          {collapsedHeader}
        </div>
      ) : (
        <div className="stq-map-station-sheet-scroll">{children}</div>
      )}
    </section>
  );
}
