import { useRef, useState } from 'react';
import type { Locale, TourDraft } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { Icon } from './Icon';
import type { StudioWorkflowSection } from './workflow/workflowTypes';

interface StudioStationNavProps {
  draft: TourDraft;
  locale: Locale;
  view: StudioWorkflowSection;
  selectedStationId: string | null;
  reorderMode: boolean;
  onSelectStation: (stationId: string) => void;
  onAddStation: () => void;
  onReorderStations: (sourceId: string, targetId: string) => void;
  onToggleReorder: () => void;
}

export function StudioStationNav({
  draft,
  locale,
  view,
  selectedStationId,
  reorderMode,
  onSelectStation,
  onAddStation,
  onReorderStations,
  onToggleReorder,
}: StudioStationNavProps) {
  const { t } = useEditorLanguage();
  const draggingStationIdRef = useRef<string | null>(null);
  const [draggingStationId, setDraggingStationId] = useState<string | null>(null);
  const [dropTargetStationId, setDropTargetStationId] = useState<string | null>(null);

  function clearDragState() {
    draggingStationIdRef.current = null;
    setDraggingStationId(null);
    setDropTargetStationId(null);
  }

  return (
    <div className="stq-author-sidebar-section stq-author-sidebar-section--stations">
      <div className="stq-author-sidebar-row">
        <div className="stq-author-sidebar-heading">{t('studio.stations')}</div>
        <button
          type="button"
          className={`stq-author-sidebar-mini-action${reorderMode ? ' is-active' : ''}`}
          onClick={onToggleReorder}
          aria-pressed={reorderMode}
        >
          <Icon name="drag" size={12} />
          {reorderMode ? t('studio.done') : t('studio.sort')}
        </button>
      </div>
      <div className="stq-author-station-nav" aria-label={t('studio.stations')}>
        {draft.stations.map((station) => {
          const active = view === 'stations' && station.id === selectedStationId;
          const dragging = draggingStationId === station.id;
          const dropTarget =
            dropTargetStationId === station.id && draggingStationId !== station.id;
          return (
            <button
              key={station.id}
              type="button"
              className={[
                'stq-author-nav-item',
                active ? 'is-active' : '',
                reorderMode ? 'is-reorderable' : '',
                dragging ? 'is-dragging' : '',
                dropTarget ? 'is-drop-target' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={reorderMode}
              onClick={() => onSelectStation(station.id)}
              onDragStart={(event) => {
                if (!reorderMode) return;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', station.id);
                draggingStationIdRef.current = station.id;
                setDraggingStationId(station.id);
              }}
              onDragOver={(event) => {
                const sourceId = draggingStationIdRef.current;
                if (!reorderMode || !sourceId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetStationId(station.id);
              }}
              onDragLeave={() => {
                if (dropTargetStationId === station.id) {
                  setDropTargetStationId(null);
                }
              }}
              onDrop={(event) => {
                const sourceId = draggingStationIdRef.current;
                if (!reorderMode || !sourceId) return;
                event.preventDefault();
                if (sourceId !== station.id) {
                  onReorderStations(sourceId, station.id);
                }
                clearDragState();
              }}
              onDragEnd={clearDragState}
              aria-current={active ? 'true' : undefined}
            >
              <span className="stq-author-nav-item__num">{station.number}</span>
              <span className="stq-author-nav-item__label">
                {getStationLocationLabel(
                  station,
                  locale,
                  `${t('studio.station')} ${station.number}`,
                )}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="stq-author-nav-item stq-author-nav-item--add"
          onClick={onAddStation}
        >
          <span className="stq-author-nav-item__plus">+</span>
          <span className="stq-author-nav-item__label">
            {t('studio.addStation')}
          </span>
        </button>
      </div>
    </div>
  );
}
