/** @vitest-environment happy-dom */
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RiddleEntry, TourDraft } from '@/schema';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { MapPreviewWorkspace } from './MapPreviewWorkspace';
import { PhoneMapMockup } from './PhoneMapMockup';
import { RouteWorkspace } from './RouteWorkspace';

vi.mock('@/hooks/useBlobUrl', () => ({
  useBlobUrl: () => undefined,
}));

vi.mock('@/i18n/editorLanguage', () => {
  const messages: Record<string, string> = {
    'studio.addStation': 'Add station',
    'studio.appPreview': 'App preview',
    'studio.back': 'Back',
    'studio.cancel': 'Abbrechen',
    'studio.close': 'Schließen',
    'studio.edit': 'Bearbeiten',
    'studio.hints': 'Hinweise',
    'studio.iconLabel': 'Icon-Label',
    'studio.map': 'Karte',
    'studio.noHint': 'Kein Hinweis',
    'studio.points': 'Punkte',
    'studio.riddleSettings': 'Riddle settings',
    'studio.save': 'Speichern',
    'studio.showHint': 'Hinweis anzeigen',
    'studio.station': 'Station',
    'studio.stationName': 'Stationsname',
    'studio.stationTitle': 'Stations-Titel',
    'studio.stations': 'Stations',
    'studio.storyHeading': 'Story-Überschrift',
    'studio.storyHeadingPlaceholder': 'z. B. Das süße Geheimnis',
    'studio.tourOverview': 'Tour overview',
    'studio.untitledTour': 'Untitled tour',
    'workflow.route': 'Route',
  };

  return {
    useEditorLanguage: () => ({
      editorLanguage: 'de',
      setEditorLanguage: () => {},
      t: (key: string) => messages[key] ?? key,
    }),
  };
});

vi.mock('@/components/map/AuthorMap', () => ({
  AuthorMap: (props: {
    stations?: Array<{ id: string; number: number; tooltip?: string }>;
    selectedStationId?: string | null;
    deletableStationIds?: string[];
    routes?: Array<{ id: string }>;
    controlAction?: { type: string } | null;
    onSelectStation?: (id: string) => void;
    onDeleteStation?: (id: string) => void;
    onMapClick?: (coordinate: { lat: number; lng: number }) => void;
    onRouteClick?: (
      routeId: string,
      coordinate: { lat: number; lng: number },
    ) => void;
  }) => (
    <div
      data-testid="author-map"
      data-selected-station={props.selectedStationId ?? ''}
      data-control-action={props.controlAction?.type ?? ''}
    >
      {props.stations?.map((station) => (
        <button
          key={station.id}
          type="button"
          aria-label={`Mock map station ${station.number}`}
          onClick={() => {
            if (props.deletableStationIds?.includes(station.id)) {
              props.onDeleteStation?.(station.id);
              return;
            }
            props.onSelectStation?.(station.id);
          }}
        >
          {station.tooltip ?? station.id}
        </button>
      ))}
      {props.routes?.map((route) => (
        <button
          key={route.id}
          type="button"
          aria-label={`Mock route ${route.id}`}
          onClick={() => props.onRouteClick?.(route.id, { lat: 46.5, lng: 11.35 })}
        >
          {route.id}
        </button>
      ))}
      <button
        type="button"
        aria-label="Mock map click"
        onClick={() => props.onMapClick?.({ lat: 46.5005, lng: 11.3505 })}
      >
        Map click
      </button>
    </div>
  ),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const NativePointerEvent = globalThis.PointerEvent;
const nativeSetPointerCapture = HTMLElement.prototype.setPointerCapture;
const nativeReleasePointerCapture = HTMLElement.prototype.releasePointerCapture;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  installBrowserInteractionMocks();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  restoreBrowserInteractionMocks();
});

describe('workspace regression flows', () => {
  it('renders RouteWorkspace route data and keeps toolbar actions reachable', () => {
    const draft = buildWorkspaceDraft();
    const onChange = vi.fn();

    render(
      <RouteWorkspace
        draft={draft}
        locale="de"
        selectedId={null}
        onSelectStation={vi.fn()}
        onChange={onChange}
        editable
        layout="desktop"
      />,
    );

    expect(container.textContent).toContain('Waltherplatz');
    expect(container.textContent).toContain('Domplatz');
    expect(control('Focus route')).not.toBeNull();
    expect(control('Undo last point in this segment')).not.toBeNull();
    expect(control('Delete current segment')).not.toBeNull();
    expect(control('Station 1 → 2')).not.toBeNull();

    clickControl('Mock map click');

    const save = control('Save segment') as HTMLButtonElement;
    expect(save.disabled).toBe(false);

    clickControl('Save segment');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(typeof onChange.mock.calls[0][0]).toBe('function');
  });

  it('toggles mobile route edit mode and keeps segment selection stable', () => {
    const draft = buildWorkspaceDraft();

    render(<RouteWorkspaceMobileHarness draft={draft} />);

    expect(control('Focus route')).toBeNull();

    clickControl('Bearbeiten');

    expect(control('Focus route')).not.toBeNull();
    expect(control('Save segment')).not.toBeNull();

    clickControl('Station 2 → 3');

    expect(
      controls('Station 2 → 3').some(
        (element) => element.getAttribute('aria-pressed') === 'true',
      ),
    ).toBe(true);

    clickControl('Bearbeiten beenden');

    expect(control('Focus route')).toBeNull();
  });

  it('renders the route workspace without crashing for empty or unusable station coordinates', () => {
    const onChange = vi.fn();
    const draft: TourDraft = {
      ...buildWorkspaceDraft(),
      stations: [station('station-a', 1, 'Placeholder', 0, 0)],
      recordedRoute: [
        {
          id: 'route-point-1',
          lat: Number.NaN,
          lng: Number.NaN,
        },
      ],
    };

    render(
      <RouteWorkspace
        draft={draft}
        locale="de"
        selectedId={null}
        onSelectStation={vi.fn()}
        onChange={onChange}
        editable
        layout="desktop"
      />,
    );

    expect(authorMap()).not.toBeNull();
    expect(control('Station 1 → 2')).toBeNull();

    clickControl('Mock map click');

    expect(onChange).not.toHaveBeenCalled();
    expect((control('Save segment') as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens and collapses the station sheet from a map station selection', () => {
    const draft = buildWorkspaceDraft();

    render(
      <MapPreviewWorkspaceHarness
        draft={draft}
        locale="de"
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
      />,
    );

    expect(stationSheet()).toBeNull();

    clickControl('Mock map station 2');

    expect(stationSheet()).not.toBeNull();
    expect(container.textContent).toContain('Domplatz');
    expect(control('Collapse station card')).not.toBeNull();

    clickControl('Collapse station card');

    expect(control('Expand station card')).not.toBeNull();

    clickControl('Expand station card');
    clickControl('Back to stations');

    expect(stationSheet()).toBeNull();
  });

  it('suppresses a stale mobile selection on initial map workspace mount', () => {
    const draft = buildWorkspaceDraft();

    render(
      <MapPreviewWorkspace
        draft={draft}
        locale="de"
        selectedId="station-a"
        onSelectStation={vi.fn()}
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
      />,
    );

    expect(stationSheet()).toBeNull();
    expect(control('Back to stations')).toBeNull();
  });

  it('keeps mobile delete mode confirmable and cancellable', () => {
    const draft = buildWorkspaceDraft();
    const onDeleteStation = vi.fn();

    render(
      <MapPreviewWorkspaceHarness
        draft={draft}
        locale="de"
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
        showDeleteStationFab
        onDeleteStation={onDeleteStation}
      />,
    );

    clickControl('Station löschen');
    clickControl('Mock map station 1');

    expect(confirmDialog()).not.toBeNull();
    expect(container.textContent).toContain('Waltherplatz');

    clickTextButton('Abbrechen');

    expect(confirmDialog()).toBeNull();
    expect(onDeleteStation).not.toHaveBeenCalled();

    clickControl('Mock map station 1');
    clickTextButton('Löschen');

    expect(onDeleteStation).toHaveBeenCalledWith('station-a');
  });

  it('closes station sheet and right drawer when delete mode starts', () => {
    const draft = buildWorkspaceDraft();

    render(
      <MapPreviewWorkspaceHarness
        draft={draft}
        locale="de"
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
        showDeleteStationFab
      />,
    );

    clickControl('Mock map station 1');
    clickControl('Bearbeiten');
    clickControl('Edit station title');
    clickControl('Edit station title');

    expect(stationSheet()).not.toBeNull();
    expect(labeledField('Stationsname')).not.toBeNull();

    clickControl('Station löschen');

    expect(stationSheet()).toBeNull();
    expect(labeledField('Stationsname')).toBeNull();
  });

  it('opens and closes the mobile station edit drawer from selection UI', () => {
    const draft = buildWorkspaceDraft();

    render(
      <MapPreviewWorkspaceHarness
        draft={draft}
        locale="de"
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
      />,
    );

    clickControl('Mock map station 1');
    clickControl('Bearbeiten');
    clickControl('Edit station title');
    clickControl('Edit station title');

    expect(control('Editor einklappen')).not.toBeNull();
    expect(labeledField('Stationsname')).not.toBeNull();

    clickControl('Schließen');

    expect(labeledField('Stationsname')).toBeNull();
  });

  it('keeps phone map dock, zoom and basemap controls reachable', () => {
    const draft = buildWorkspaceDraft();
    const onSelectStation = vi.fn();

    render(
      <PhoneMapMockup
        draft={draft}
        locale="de"
        selectedId={null}
        onSelectStation={onSelectStation}
        detail="Karte"
        showLayersControl
      />,
    );

    expect(control('Back')).not.toBeNull();
    expect(control('Tour overview')).not.toBeNull();
    expect(control('Station 1')).not.toBeNull();
    expect(control('Stations')).not.toBeNull();
    expect(control('Zoom in')).not.toBeNull();
    expect(control('Zoom out')).not.toBeNull();
    expect(control('Layers')).not.toBeNull();

    clickControl('Layers');

    expect(container.textContent).toContain('Streets');
    expect(container.textContent).toContain('Outdoors');
    expect(container.textContent).toContain('Satellite');

    clickControl('Zoom in');

    expect(authorMap()?.dataset.controlAction).toBe('zoomIn');

    clickControl('Zoom out');

    expect(authorMap()?.dataset.controlAction).toBe('zoomOut');

    clickControl('Station 1');

    expect(onSelectStation).toHaveBeenCalledWith('station-a');
  });

  it('suppresses accidental dock activation after a drag gesture', () => {
    const draft = buildWorkspaceDraft();
    const onSelectStation = vi.fn();

    render(
      <PhoneMapMockup
        draft={draft}
        locale="de"
        selectedId={null}
        onSelectStation={onSelectStation}
        detail="Karte"
      />,
    );

    const dockTrack = container.querySelector<HTMLElement>('[role="list"]');
    if (!dockTrack) {
      throw new Error('Dock track not found');
    }

    act(() => {
      dockTrack.dispatchEvent(pointerEvent('pointerdown', 100));
      dockTrack.dispatchEvent(pointerEvent('pointermove', 40));
      dockTrack.dispatchEvent(pointerEvent('pointerup', 40));
    });

    clickControl('Station 1');

    expect(onSelectStation).not.toHaveBeenCalled();

    clickControl('Station 1');

    expect(onSelectStation).toHaveBeenCalledWith('station-a');
  });
});

function render(element: ReactElement) {
  act(() => {
    root.render(element);
  });
}

function MapPreviewWorkspaceHarness(
  props: Omit<
    Parameters<typeof MapPreviewWorkspace>[0],
    'selectedId' | 'onSelectStation'
  > & {
    onSelectStation?: (id: string) => void;
  },
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <MapPreviewWorkspace
      {...props}
      selectedId={selectedId}
      onSelectStation={(stationId) => {
        setSelectedId(stationId);
        props.onSelectStation?.(stationId);
      }}
    />
  );
}

function RouteWorkspaceMobileHarness({ draft }: { draft: TourDraft }) {
  const [mapEditMode, setMapEditMode] = useState(false);
  return (
    <RouteWorkspace
      draft={draft}
      locale="de"
      selectedId={null}
      onSelectStation={vi.fn()}
      onChange={vi.fn()}
      editable
      layout="mobile"
      mapEditMode={mapEditMode}
      onToggleMapEditMode={() => setMapEditMode((active) => !active)}
    />
  );
}

function clickControl(label: string) {
  const target = control(label);
  if (!target) {
    throw new Error(`Control not found: ${label}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function clickTextButton(text: string) {
  const target = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === text,
  );
  if (!target) {
    throw new Error(`Button text not found: ${text}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function controls(label: string): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('button, [role="button"]'),
  ).filter((element) => element.getAttribute('aria-label') === label);
}

function control(label: string): HTMLElement | null {
  return (
    controls(label)[0] ?? null
  );
}

function labeledField(label: string): HTMLElement | null {
  const fieldId = Array.from(container.querySelectorAll('label')).find(
    (element) => element.textContent === label,
  )?.getAttribute('for');
  return fieldId ? document.getElementById(fieldId) : null;
}

function stationSheet(): HTMLElement | null {
  return container.querySelector('[aria-label="Station details"]');
}

function confirmDialog(): HTMLElement | null {
  return container.querySelector('[aria-label="Station löschen bestätigen"]');
}

function authorMap(): HTMLElement | null {
  return container.querySelector('[data-testid="author-map"]');
}

function pointerEvent(type: string, clientX: number): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    clientX,
    pointerId: 1,
    pointerType: 'mouse',
  });
}

function installBrowserInteractionMocks() {
  if (!globalThis.PointerEvent) {
    Object.defineProperty(globalThis, 'PointerEvent', {
      configurable: true,
      writable: true,
      value: MockPointerEvent,
    });
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
}

function restoreBrowserInteractionMocks() {
  if (NativePointerEvent) {
    Object.defineProperty(globalThis, 'PointerEvent', {
      configurable: true,
      writable: true,
      value: NativePointerEvent,
    });
  } else {
    delete (
      globalThis as typeof globalThis & { PointerEvent?: typeof PointerEvent }
    ).PointerEvent;
  }

  if (nativeSetPointerCapture) {
    HTMLElement.prototype.setPointerCapture = nativeSetPointerCapture;
  } else {
    delete (HTMLElement.prototype as Partial<HTMLElement>).setPointerCapture;
  }

  if (nativeReleasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = nativeReleasePointerCapture;
  } else {
    delete (HTMLElement.prototype as Partial<HTMLElement>).releasePointerCapture;
  }
}

class MockPointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
  }
}

function buildWorkspaceDraft(): TourDraft {
  return {
    ...buildValidDraft(),
    stations: [
      station('station-a', 1, 'Waltherplatz', 46.5, 11.35),
      station('station-b', 2, 'Domplatz', 46.501, 11.351),
      station('station-c', 3, 'Laubengasse', 46.502, 11.352),
    ],
    recordedRoute: [],
  };
}

function station(
  id: string,
  number: number,
  location: string,
  lat: number,
  lng: number,
): RiddleEntry {
  const entry = buildValidStation(id, number);
  entry.position_lat = lat;
  entry.position_lng = lng;
  entry.de.location = location;
  entry.en.location = location;
  entry.it.location = location;
  return entry;
}
