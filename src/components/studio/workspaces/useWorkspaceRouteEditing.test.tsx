/** @vitest-environment happy-dom */
import { act, useEffect, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordedRoutePoint, RiddleEntry, TourDraft } from '@/schema';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { stationAnchorPoint } from './routeWorkspaceHelpers';
import { useWorkspaceRouteEditing } from './useWorkspaceRouteEditing';
import type { DraftChangeHandler } from './workspaceTypes';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type RouteEditingState = ReturnType<typeof useWorkspaceRouteEditing>;

let container: HTMLDivElement;
let root: Root;
let currentDraft: TourDraft;
let currentEditable: boolean;
let latest: RouteEditingState | null;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-05-15T12:00:00Z'));
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  currentDraft = buildRouteDraft();
  currentEditable = true;
  latest = null;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.useRealTimers();
});

describe('useWorkspaceRouteEditing', () => {
  it('initializes the first valid segment and falls back when selection becomes invalid', () => {
    renderHookState();

    expect(hook().selectedSegmentFromId).toBe('station-a');
    expect(hook().selectedStation?.id).toBe('station-a');
    expect(hook().nextStation?.id).toBe('station-b');

    act(() => {
      hook().setSelectedSegmentFromId('station-b');
    });

    expect(hook().selectedSegmentFromId).toBe('station-b');

    currentDraft = {
      ...currentDraft,
      stations: [currentDraft.stations[0], currentDraft.stations[2]],
    };
    renderHookState();

    expect(hook().selectedSegmentFromId).toBe('station-a');
    expect(hook().nextStation?.id).toBe('station-c');
  });

  it('adds map and station points to pending segment state without duplicating nearby points', () => {
    renderHookState();

    act(() => {
      hook().handleMapClick({ lat: 46.5005, lng: 11.3505 });
    });

    expect(hook().pendingSegmentPoints).toHaveLength(2);
    expect(hook().pendingSegmentPoints?.[0]).toMatchObject({
      lat: stationA().position_lat,
      lng: stationA().position_lng,
    });
    expect(hook().routePointMarkers).toHaveLength(1);
    expect(hook().routePointMarkers[0].coordinate).toEqual({
      lat: 46.5005,
      lng: 11.3505,
    });

    act(() => {
      hook().handleMapClick({ lat: 46.5005, lng: 11.3505 });
    });

    expect(hook().pendingSegmentPoints).toHaveLength(2);

    act(() => {
      hook().handleStationSelect('station-b');
    });

    expect(hook().pendingSegmentPoints).toHaveLength(3);
    expect(hook().pendingSegmentPoints?.at(-1)).toMatchObject({
      lat: stationB().position_lat,
      lng: stationB().position_lng,
    });
    expect(hook().canSaveSegment).toBe(true);
  });

  it('saves pending edits back into the selected recorded segment and advances selection', () => {
    const oldInterior = point(46.5004, 11.3504, 10);
    currentDraft = {
      ...currentDraft,
      recordedRoute: [
        stationAnchorPoint(stationA(), 1),
        oldInterior,
        stationAnchorPoint(stationB(), 2),
      ],
    };
    renderHookState();

    act(() => {
      hook().handleMapClick({ lat: 46.5007, lng: 11.3507 });
    });
    act(() => {
      hook().saveSegment();
    });
    renderHookState();

    expect(currentDraft.recordedRoute).toHaveLength(4);
    expect(currentDraft.recordedRoute).toContain(oldInterior);
    expect(currentDraft.recordedRoute[0]).toMatchObject({
      lat: stationA().position_lat,
      lng: stationA().position_lng,
    });
    expect(currentDraft.recordedRoute[2]).toMatchObject({
      lat: 46.5007,
      lng: 11.3507,
    });
    expect(currentDraft.recordedRoute[3]).toMatchObject({
      lat: stationB().position_lat,
      lng: stationB().position_lng,
    });
    expect(hook().selectedSegmentFromId).toBe('station-b');
  });

  it('clears only interior points from a saved segment', () => {
    currentDraft = {
      ...currentDraft,
      recordedRoute: [
        stationAnchorPoint(stationA(), 1),
        point(46.5004, 11.3504, 10),
        stationAnchorPoint(stationB(), 2),
      ],
    };
    renderHookState();

    act(() => {
      hook().clearSegment();
    });
    renderHookState();

    expect(currentDraft.recordedRoute).toEqual([
      stationAnchorPoint(stationA(), 1),
      stationAnchorPoint(stationB(), 2),
    ]);
  });

  it('restores a saved segment into pending state when undoing without mutating the draft', () => {
    const savedRoute = [
      stationAnchorPoint(stationA(), 1),
      point(46.5004, 11.3504, 10),
      stationAnchorPoint(stationB(), 2),
    ];
    currentDraft = {
      ...currentDraft,
      recordedRoute: savedRoute,
    };
    renderHookState();

    act(() => {
      hook().undoLast();
    });

    expect(hook().pendingSegmentPoints).toEqual([
      stationAnchorPoint(stationA(), 1),
      stationAnchorPoint(stationB(), 2),
    ]);
    expect(currentDraft.recordedRoute).toBe(savedRoute);
  });

  it('clears pending edits and ignores new input when editing is disabled', () => {
    renderHookState();

    act(() => {
      hook().handleMapClick({ lat: 46.5005, lng: 11.3505 });
    });

    expect(hook().pendingSegmentPoints).toHaveLength(2);

    currentEditable = false;
    renderHookState();

    expect(hook().pendingSegmentPoints).toBeNull();

    act(() => {
      hook().handleMapClick({ lat: 46.5006, lng: 11.3506 });
      hook().saveSegment();
    });

    expect(hook().pendingSegmentPoints).toBeNull();
    expect(currentDraft.recordedRoute).toEqual([]);
  });
});

function HookHarness({
  draft,
  editable,
  onChange,
}: {
  draft: TourDraft;
  editable: boolean;
  onChange: DraftChangeHandler;
}) {
  const state = useWorkspaceRouteEditing({ draft, editable, onChange });
  useEffect(() => {
    latest = state;
  }, [state]);
  return null;
}

function renderHookState(element?: ReactElement) {
  act(() => {
    root.render(
      element ?? (
        <HookHarness
          draft={currentDraft}
          editable={currentEditable}
          onChange={handleDraftChange}
        />
      ),
    );
  });
}

function handleDraftChange(
  patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
) {
  currentDraft =
    typeof patch === 'function'
      ? patch(currentDraft)
      : { ...currentDraft, ...patch };
}

function hook(): RouteEditingState {
  if (!latest) {
    throw new Error('Route editing hook was not rendered');
  }
  return latest;
}

function buildRouteDraft(): TourDraft {
  return {
    ...buildValidDraft(),
    stations: [
      station('station-a', 1, 46.5, 11.35),
      station('station-b', 2, 46.501, 11.351),
      station('station-c', 3, 46.502, 11.352),
    ],
    recordedRoute: [],
  };
}

function station(
  id: string,
  number: number,
  lat: number,
  lng: number,
): RiddleEntry {
  const entry = buildValidStation(id, number);
  entry.position_lat = lat;
  entry.position_lng = lng;
  return entry;
}

function stationA(): RiddleEntry {
  return currentDraft.stations[0];
}

function stationB(): RiddleEntry {
  return currentDraft.stations[1];
}

function point(
  lat: number,
  lng: number,
  timestamp: number,
): RecordedRoutePoint {
  return { lat, lng, timestamp };
}
