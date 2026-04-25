import { useEffect, useRef, useState } from 'react';
import type { Locale, RiddleEntry } from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { Icon } from './Icon';
import { stationCompleteness } from './completeness';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';

interface Props {
  stations: RiddleEntry[];
  selectedId: string | null;
  locale: Locale;
  reorderMode?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder?: (sourceId: string, targetId: string) => void;
  onOpenFullEditor?: (stationId: string) => void;
}

export function Swimlane({
  stations,
  selectedId,
  locale,
  reorderMode = false,
  onSelect,
  onAdd,
  onReorder,
  onOpenFullEditor,
}: Props) {
  const laneRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!laneRef.current || !selectedId) return;
    const lane = laneRef.current;
    const card = lane.querySelector<HTMLElement>(
      `[data-station="${selectedId}"]`,
    );
    if (!card) return;
    const laneBox = lane.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    const delta =
      cardBox.left + cardBox.width / 2 - (laneBox.left + laneBox.width / 2);
    lane.scrollTo({ left: lane.scrollLeft + delta, behavior: 'smooth' });
  }, [selectedId]);

  useEffect(() => {
    if (!reorderMode) {
      setDraggingId(null);
      setDropTargetId(null);
    }
  }, [reorderMode]);

  return (
    <div
      ref={laneRef}
      className="studio-scroll"
      style={{
        display: 'flex',
        gap: 14,
        padding: '12px 20px 18px',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x proximity',
      }}
    >
      {stations.map((station, i) => (
        <StationCard
          key={station.id}
          station={station}
          index={i}
          locale={locale}
          active={station.id === selectedId}
          reorderMode={reorderMode}
          dragging={draggingId === station.id}
          isDropTarget={dropTargetId === station.id && draggingId !== station.id}
          onSelect={() => {
            if (reorderMode) return;
            onSelect(station.id);
          }}
          onDragStart={() => {
            if (!reorderMode) return;
            setDraggingId(station.id);
          }}
          onDragOver={() => {
            if (!reorderMode || !draggingId || draggingId === station.id) return;
            setDropTargetId(station.id);
          }}
          onDragLeave={() => {
            if (dropTargetId === station.id) setDropTargetId(null);
          }}
          onDrop={() => {
            if (!reorderMode || !draggingId || draggingId === station.id) {
              setDraggingId(null);
              setDropTargetId(null);
              return;
            }
            onReorder?.(draggingId, station.id);
            setDraggingId(null);
            setDropTargetId(null);
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDropTargetId(null);
          }}
          onOpenFullEditor={
            onOpenFullEditor
              ? () => onOpenFullEditor(station.id)
              : undefined
          }
        />
      ))}
      <button
        onClick={onAdd}
        className="studio-lane-card"
        style={{
          width: 200,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: '1.5px dashed var(--stq-border)',
          color: 'var(--stq-primary)',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <div style={{ textAlign: 'center', padding: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              background: 'var(--stq-primary-soft)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 8px',
            }}
          >
            <Icon name="plus" size={18} color="var(--stq-primary)" />
          </div>
          Add station
          <div
            style={{
              fontSize: 11,
              color: 'var(--stq-text-mute)',
              fontWeight: 400,
              marginTop: 4,
            }}
          >
            or drop a pin on the map
          </div>
        </div>
      </button>
    </div>
  );
}

function StationCard({
  station,
  index: _index,
  locale,
  active,
  reorderMode,
  dragging,
  isDropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onOpenFullEditor,
}: {
  station: RiddleEntry;
  index: number;
  locale: Locale;
  active: boolean;
  reorderMode: boolean;
  dragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onOpenFullEditor?: () => void;
}) {
  const photoUrl = useBlobUrl(station.imageBlobId);
  const { percent, hasPhoto, hasGps, hasRiddle } = stationCompleteness(
    station,
    locale,
  );
  const localeContent = station[locale];
  const status: 'done' | 'warn' | 'err' =
    percent === 100 ? 'done' : percent >= 25 ? 'warn' : 'err';
  const statusLabel =
    status === 'done' ? 'Ready' : status === 'warn' ? 'Draft' : 'Empty';

  const cardClass = [
    'studio-lane-card',
    active ? 'active' : '',
    reorderMode ? 'reorder-mode' : '',
    dragging ? 'dragging' : '',
    isDropTarget ? 'drop-target' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      data-station={station.id}
      type="button"
      className={cardClass}
      onClick={onSelect}
      style={{ scrollSnapAlign: 'center', position: 'relative' }}
      draggable={reorderMode}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', station.id);
        onDragStart();
      }}
      onDragOver={(e) => {
        if (!reorderMode) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (!reorderMode) return;
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
    >
      <div style={{ position: 'relative' }}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            style={{
              width: '100%',
              height: 130,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            className="studio-placeholder-stripe"
            style={{
              height: 130,
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(144,74,72,0.55)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <Icon name="camera" size={22} color="rgba(144,74,72,0.6)" />
              <div
                style={{
                  fontSize: 10,
                  marginTop: 6,
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                }}
              >
                NO PHOTO YET
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.96)',
              boxShadow: 'var(--stq-shadow-soft)',
            }}
          >
            <StationIconPreview
              station={station}
              style={{ width: 30, height: 30 }}
            />
          </div>
          <div className="studio-pin">{station.number}</div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            className="studio-chip"
            style={{ padding: '2px 8px', fontSize: 10, background: 'rgba(255,255,255,0.95)' }}
          >
            <span className={`studio-dot studio-dot--${status === 'done' ? 'ok' : status}`} />
            {statusLabel}
          </span>
          {onOpenFullEditor && (
            <button
              type="button"
              className="studio-lane-edit-btn"
              aria-label="Open full station editor"
              title="Open full station editor"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFullEditor();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              draggable={false}
            >
              <Icon name="edit" size={13} />
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: '11px 12px 12px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' }}>
          {localeContent.location || (
            <span style={{ color: 'var(--stq-text-mute)', fontWeight: 400, fontStyle: 'italic' }}>
              Unnamed station
            </span>
          )}
        </div>
        <div className="studio-progress" style={{ marginTop: 10 }}>
          <div style={{ width: `${percent}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 8,
            fontSize: 10.5,
            color: 'var(--stq-text-mute)',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon
              name="camera"
              size={11}
              color={hasPhoto ? 'var(--stq-success)' : 'var(--stq-text-mute)'}
            />
            {hasPhoto ? 'Photo' : '—'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon
              name="map-pin"
              size={11}
              color={hasGps ? 'var(--stq-success)' : 'var(--stq-text-mute)'}
            />
            GPS
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Icon
              name="sparkles"
              size={11}
              color={hasRiddle ? 'var(--stq-success)' : 'var(--stq-text-mute)'}
            />
            Riddle
          </span>
        </div>
      </div>
      {reorderMode && (
        <span className="studio-lane-drag-handle" aria-hidden>
          <Icon name="drag" size={14} />
        </span>
      )}
    </button>
  );
}
