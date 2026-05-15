import type { ReactNode } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { MapEditPill } from './MapEditPill';
import { PhoneMapMockup } from './PhoneMapMockup';
import {
  RouteWorkspaceEditPillContent,
  RouteWorkspaceStats,
  RouteWorkspaceToolbar,
} from './RouteWorkspaceViews';
import { formatDistance } from './routeWorkspaceHelpers';
import { useWorkspaceRouteEditing } from './useWorkspaceRouteEditing';
import type { BaseWorkspaceProps } from './workspaceTypes';

interface Props extends BaseWorkspaceProps {
  selectedId: string | null;
  onSelectStation: (id: string) => void;
  editable?: boolean;
  topRightPill?: ReactNode;
  /** When true, render the round edit-mode toggle inside the map pill. */
  mapEditMode?: boolean;
  /** Toggle handler for the round map edit-mode toggle. */
  onToggleMapEditMode?: () => void;
  layout?: 'desktop' | 'mobile';
}

export function RouteWorkspace({
  draft,
  locale,
  selectedId,
  onSelectStation,
  onChange,
  editable = true,
  topRightPill,
  mapEditMode,
  onToggleMapEditMode,
  layout = 'mobile',
}: Props) {
  const { t } = useEditorLanguage();
  const routeEditing = useWorkspaceRouteEditing({
    draft,
    editable,
    onChange,
  });

  const fromLabel = routeEditing.selectedStation
    ? routeEditing.selectedStation[locale].location ||
      `${t('studio.station')} ${routeEditing.selectedStation.number}`
    : '—';
  const toLabel = routeEditing.nextStation
    ? routeEditing.nextStation[locale].location ||
      `${t('studio.station')} ${routeEditing.nextStation.number}`
    : '—';
  const distanceLabel = formatDistance(routeEditing.totalDistance);
  const pointsLabel = t('studio.points');

  const routeEditorTools = (
    <RouteWorkspaceToolbar
      focusEnabled={routeEditing.focusEnabled}
      focusDisabled={
        !routeEditing.focusEnabled && routeEditing.fitPoints.length < 2
      }
      saveDisabled={!routeEditing.canSaveSegment}
      undoDisabled={
        routeEditing.pendingSegmentPoints
          ? routeEditing.pendingSegmentPoints.length <= 1
          : !routeEditing.savedSelectedSegmentPoints ||
            routeEditing.savedSelectedSegmentPoints.length <= 1
      }
      clearDisabled={
        !routeEditing.segmentSlice ||
        routeEditing.segmentSlice.end - routeEditing.segmentSlice.start <= 1
      }
      onToggleFocus={routeEditing.toggleFocus}
      onSaveSegment={routeEditing.saveSegment}
      onUndoLast={routeEditing.undoLast}
      onClearSegment={routeEditing.clearSegment}
    />
  );

  return (
    <PhoneMapMockup
      draft={draft}
      locale={locale}
      selectedId={selectedId}
      onSelectStation={
        editable ? routeEditing.handleStationSelect : onSelectStation
      }
      detail={t('workflow.route')}
      routes={routeEditing.routes}
      routePointMarkers={editable ? routeEditing.routePointMarkers : undefined}
      onRoutePointCoordinateChange={
        editable ? routeEditing.handleRoutePointDrag : undefined
      }
      onMapClick={editable ? routeEditing.handleMapClick : undefined}
      onRouteClick={
        editable
          ? (routeId) => {
              const match = routeId.match(/-(\d+)$/);
              if (!match) return;
              const segmentIndex = Number(match[1]);
              const fromStation = draft.stations[segmentIndex];
              if (!fromStation) return;
              routeEditing.setSelectedSegmentFromId(fromStation.id);
            }
          : undefined
      }
      topRightPill={
        layout === 'desktop'
          ? undefined
          : onToggleMapEditMode ? (
              <MapEditPill
                active={Boolean(mapEditMode)}
                onToggle={onToggleMapEditMode}
                content={
                  mapEditMode && editable ? (
                    <RouteWorkspaceEditPillContent
                      toolbar={routeEditorTools}
                      trailing={topRightPill}
                      distanceLabel={distanceLabel}
                      pointCount={draft.recordedRoute.length}
                      pointsLabel={pointsLabel}
                    />
                  ) : null
                }
              />
            ) : topRightPill || editable ? (
              <>
                {topRightPill}
                {editable && (
                  <div className="stq-mobile-map-edit-actions stq-mobile-map-edit-actions--route">
                    {routeEditorTools}
                  </div>
                )}
              </>
            ) : undefined
      }
      desktopActions={
        layout === 'desktop' && (topRightPill || editable) ? (
          <>
            {topRightPill}
            {editable && (
              <div className="stq-mobile-map-edit-actions">
                {routeEditorTools}
              </div>
            )}
          </>
        ) : undefined
      }
      showLayersControl
      fitToCoordinates={
        routeEditing.focusEnabled && routeEditing.fitPoints.length > 1
          ? routeEditing.fitPoints
          : undefined
      }
      fitTrigger={
        routeEditing.focusEnabled
          ? `${routeEditing.focusTrigger ?? 'on'}:${routeEditing.fitSignature}`
          : undefined
      }
      bottomSheet={
        layout === 'mobile' && onToggleMapEditMode ? undefined : (
          <RouteWorkspaceStats
            label={t('workflow.route')}
            distanceLabel={distanceLabel}
            fromLabel={fromLabel}
            toLabel={toLabel}
            pointCount={draft.recordedRoute.length}
            pointsLabel={pointsLabel}
          />
        )
      }
      segmentArrows={
        editable
          ? {
              selectedFromId: routeEditing.selectedSegmentFromId,
              onSelect: (fromStationId) => {
                routeEditing.setSelectedSegmentFromId(fromStationId);
              },
            }
          : undefined
      }
    />
  );
}
