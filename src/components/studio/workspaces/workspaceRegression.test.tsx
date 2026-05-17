/** @vitest-environment happy-dom */
import { act, useState, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RiddleEntry, TourDraft } from '@/schema';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { TourCardCanvas } from '../TourCardCanvas';
import { IntroPhonePreview } from './IntroPhonePreview';
import { MapEditPill } from './MapEditPill';
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
    'studio.copyTour': 'Tour kopieren',
    'studio.coverImageEdit': 'Titelbild bearbeiten',
    'studio.edit': 'Bearbeiten',
    'studio.descriptionEdit': 'Beschreibung bearbeiten',
    'studio.hints': 'Hinweise',
    'studio.iconLabel': 'Icon-Label',
    'studio.languages': 'Sprachen',
    'studio.chooseLanguage': 'Sprache wählen',
    'studio.map': 'Karte',
    'studio.noStations': 'Noch keine Stationen',
    'studio.noHint': 'Kein Hinweis',
    'studio.points': 'Punkte',
    'studio.paragraphPlaceholder': 'Absatz',
    'studio.paragraphsOnePerEntry': 'Absätze',
    'studio.addEntry': 'Eintrag hinzufügen',
    'studio.moveUp': 'Nach oben',
    'studio.moveDown': 'Nach unten',
    'studio.deleteEntry': 'Eintrag löschen',
    'studio.riddleSettings': 'Riddle settings',
    'studio.save': 'Speichern',
    'studio.showHint': 'Hinweis anzeigen',
    'studio.station': 'Station',
    'studio.stationName': 'Stationsname',
    'studio.stationTitle': 'Stations-Titel',
    'studio.stations': 'Stations',
    'studio.storyHeading': 'Story-Überschrift',
    'studio.storyHeadingPlaceholder': 'z. B. Das süße Geheimnis',
    'studio.title': 'Titel',
    'studio.titleLocation': 'Titel & Ort',
    'studio.titleLocationEdit': 'Edit title and location',
    'studio.location': 'Ort',
    'studio.locationPlaceholder': 'Ort der Tour',
    'studio.noLocation': 'No location',
    'studio.tourOverview': 'Tour overview',
    'studio.deleteTour': 'Tour löschen',
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
  it('commits tour overview title and location as ordered async field updates', async () => {
    const draft = buildWorkspaceDraft();
    let persisted = draft;
    const onChange = vi.fn(
      async (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => {
        const current = persisted;
        await new Promise((resolve) => setTimeout(resolve, 0));
        persisted =
          typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      },
    );

    render(
      <TourCardCanvas
        draft={draft}
        locale="de"
        onChange={onChange}
      />,
    );

    clickControl('Edit title and location');
    setFieldValue('Titel', 'Neue Tour');
    setFieldValue('Ort', 'Bozen');
    await clickTextButtonAsync('Speichern');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(persisted.tour.de.title).toBe('Neue Tour');
    expect(persisted.tour.de.location).toBe('Bozen');
  });

  it('keeps the primary intro action clickable without stations', () => {
    const onStartTour = vi.fn();

    render(
      <IntroPhonePreview
        draft={{ ...buildWorkspaceDraft(), stations: [] }}
        locale="de"
        onChange={vi.fn()}
        onStartTour={onStartTour}
        editable={false}
      />,
    );

    const start = textButton('Noch keine Stationen');
    expect(start?.disabled).toBe(false);

    clickTextButton('Noch keine Stationen');

    expect(onStartTour).toHaveBeenCalledTimes(1);
  });

  it('deletes intro text paragraphs without restoring duplicate rows', () => {
    function IntroTextHarness() {
      const [draft, setDraft] = useState(() => {
        const initial = buildWorkspaceDraft();
        initial.tour.de.introSection = [
          { type: 'paragraph', text: 'First paragraph' },
          { type: 'paragraph', text: 'Second paragraph' },
        ];
        return initial;
      });

      return (
        <IntroPhonePreview
          draft={draft}
          locale="de"
          onChange={(patch) =>
            setDraft((current) =>
              typeof patch === 'function'
                ? patch(current)
                : { ...current, ...patch },
            )
          }
          editable
        />
      );
    }

    render(<IntroTextHarness />);

    clickControl('Beschreibung bearbeiten');
    expect(container.textContent).toContain('Second paragraph');

    clickControlAt('Eintrag löschen', 1);

    expect(container.textContent).toContain('First paragraph');
    expect(container.textContent).not.toContain('Second paragraph');
  });

  it('keeps intro key-data lines out of paragraph delete commits', () => {
    function IntroTextHarness() {
      const [draft, setDraft] = useState(() => {
        const initial = buildWorkspaceDraft();
        initial.tour.de.introSection = [
          { type: 'paragraph', text: 'First paragraph' },
          { type: 'line', text: 'Distance: 2 km' },
          { type: 'line', text: 'Time: 40 min' },
          { type: 'paragraph', text: 'Second paragraph' },
          { type: 'paragraph', text: 'Third paragraph' },
        ];
        return initial;
      });

      return (
        <IntroPhonePreview
          draft={draft}
          locale="de"
          onChange={(patch) =>
            setDraft((current) =>
              typeof patch === 'function'
                ? patch(current)
                : { ...current, ...patch },
            )
          }
          editable
        />
      );
    }

    render(<IntroTextHarness />);

    clickControl('Beschreibung bearbeiten');

    expect(textEntryValues()).toEqual([
      'First paragraph',
      'Second paragraph',
      'Third paragraph',
    ]);

    clickControlAt('Eintrag löschen', 2);

    expect(textEntryValues()).toEqual(['First paragraph', 'Second paragraph']);
    expect(container.textContent).toContain('Distance: 2 km');
    expect(container.textContent).toContain('Time: 40 min');
    expect(container.textContent).not.toContain('Third paragraph');
  });

  it('uses the shared major edit button styling for the map edit toggle', () => {
    render(
      <MapEditPill content={null} active={false} onToggle={vi.fn()} />,
    );

    expect(control('Bearbeiten')?.classList.contains(
      'stq-mobile-studio__major-edit-toggle',
    )).toBe(true);
  });

  it('moves phone language selection into the header settings action', () => {
    const onLocaleChange = vi.fn();

    render(
      <TourCardCanvas
        draft={buildWorkspaceDraft()}
        locale="de"
        onChange={vi.fn()}
        onLocaleChange={onLocaleChange}
        floatingEditToggle={
          <button type="button" aria-label="Bearbeiten">
            edit
          </button>
        }
      />,
    );

    expect(container.querySelector('.stq-tour-card-phone-header-locale')).toBeNull();
    expect(control('Bearbeiten')).not.toBeNull();

    clickControl('Sprachen');
    clickButtonContaining('English');

    expect(onLocaleChange).toHaveBeenCalledWith('en');
  });

  it('anchors mobile map edit controls inside the tour title pill', () => {
    render(
      <MapPreviewWorkspaceHarness
        draft={buildWorkspaceDraft()}
        locale="de"
        onAddStation={vi.fn()}
        onChange={vi.fn()}
        layout="mobile"
        mapEditMode
        onToggleMapEditMode={vi.fn()}
        showAddStationFab
      />,
    );

    expect(
      container.querySelector(
        '.stq-phone-map-title-pill__action .stq-phone-map-edit-pill__toggle',
      ),
    ).toBe(control('Bearbeiten beenden'));
    expect(container.querySelector('.stq-phone-map-edit-pill')).toBeNull();
    expect(control('Add station')).not.toBeNull();
  });

  it('keeps tour copy and delete actions on the editable cover overlay', () => {
    const onDuplicateTour = vi.fn();
    const onDeleteTour = vi.fn();

    render(
      <TourCardCanvas
        draft={buildWorkspaceDraft()}
        locale="de"
        onChange={vi.fn()}
        onDuplicateTour={onDuplicateTour}
        onDeleteTour={onDeleteTour}
        editable
        mobileSelectionFlow
      />,
    );

    clickControl('Tour kopieren');
    clickControl('Tour löschen');

    expect(onDuplicateTour).toHaveBeenCalledTimes(1);
    expect(onDeleteTour).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector('.stq-tour-card-cover > .stq-tour-card-cover-actions'),
    ).not.toBeNull();
    expect(control('Titelbild bearbeiten')?.getAttribute('aria-pressed')).toBe(
      null,
    );
    expect(textButton('Tour löschen')).toBeNull();
  });

  it('uses the cover area camera control as the tour image edit entry', () => {
    const draft = buildWorkspaceDraft();

    render(
      <TourCardCanvas
        draft={{
          ...draft,
          tour: { ...draft.tour, imagePath: '', coverBlobId: undefined },
        }}
        locale="de"
        onChange={vi.fn()}
        editable
        mobileSelectionFlow
      />,
    );

    expect(
      container
        .querySelector('.stq-tour-card-cover')
        ?.classList.contains('stq-editable-image-frame'),
    ).toBe(true);

    clickElement('.stq-tour-card-cover');

    expect(control('Titelbild bearbeiten')?.getAttribute('aria-pressed')).toBe(
      null,
    );

    clickControl('Titelbild bearbeiten');

    expect(control('Titelbild bearbeiten')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(container.textContent).toContain('studio.tourImage');
  });

  it('uses the intro cover camera control as the tour image edit entry', () => {
    const draft = buildWorkspaceDraft();

    render(
      <IntroPhonePreview
        draft={{
          ...draft,
          tour: { ...draft.tour, imagePath: '', coverBlobId: undefined },
        }}
        locale="de"
        onChange={vi.fn()}
        editable
        mobileSelectionFlow
      />,
    );

    expect(
      container
        .querySelector('.stq-intro-phone__hero')
        ?.classList.contains('stq-editable-image-frame'),
    ).toBe(true);

    clickElement('.stq-intro-phone__hero');

    expect(control('Titelbild bearbeiten')?.getAttribute('aria-pressed')).toBe(
      null,
    );

    clickControl('Titelbild bearbeiten');

    expect(control('Titelbild bearbeiten')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(container.textContent).toContain('studio.tourImage');
  });

  it('uses only the station image camera control as the station image edit entry', () => {
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

    expect(
      container
        .querySelector('.stq-riddle-map-card-image')
        ?.classList.contains('stq-editable-image-frame'),
    ).toBe(true);

    clickElement('.stq-riddle-map-card-image');

    expect(container.textContent).not.toContain('Stations-Bild & Icon');

    clickControl('Edit station image');

    expect(control('Edit station image')?.getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(container.textContent).toContain('Stations-Bild & Icon');
  });

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

  it('hides map delete mode while the station sheet is open', () => {
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

    expect(control('Bearbeiten')?.classList.contains(
      'stq-mobile-studio__major-edit-toggle',
    )).toBe(true);

    clickControl('Bearbeiten');
    clickControl('Edit station title');

    expect(stationSheet()).not.toBeNull();
    expect(labeledField('Stationsname')).not.toBeNull();

    expect(control('Station löschen')).toBeNull();

    clickControl('Schließen');

    expect(labeledField('Stationsname')).toBeNull();
    expect(stationSheet()).not.toBeNull();
    expect(control('Station löschen')).toBeNull();

    clickControl('Back to stations');

    expect(stationSheet()).toBeNull();
    expect(control('Station löschen')).not.toBeNull();
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

function clickControlAt(label: string, index: number) {
  const target = controls(label)[index];
  if (!target) {
    throw new Error(`Control not found: ${label} at ${index}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

async function clickTextButtonAsync(text: string) {
  const target = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === text,
  );
  if (!target) {
    throw new Error(`Button text not found: ${text}`);
  }
  await act(async () => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

function clickTextButton(text: string) {
  const target = textButton(text);
  if (!target) {
    throw new Error(`Button text not found: ${text}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function clickButtonContaining(text: string) {
  const target = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.includes(text),
  );
  if (!target) {
    throw new Error(`Button containing text not found: ${text}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function clickElement(selector: string) {
  const target = container.querySelector<HTMLElement>(selector);
  if (!target) {
    throw new Error(`Element not found: ${selector}`);
  }
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function textButton(text: string): HTMLButtonElement | null {
  return (
    Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === text,
    ) ?? null
  );
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

function textEntryValues(): string[] {
  return Array.from(
    container.querySelectorAll<HTMLTextAreaElement>('.stq-textbody-textarea'),
  ).map((field) => field.value);
}

function setFieldValue(label: string, value: string) {
  const field = labeledField(label);
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
    throw new Error(`Editable field not found: ${label}`);
  }

  const prototype =
    field instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  act(() => {
    valueSetter?.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
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
