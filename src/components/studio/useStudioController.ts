import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createId,
  emptyStation,
  type Locale,
  type TourDraft,
} from '@/schema';
import { useExportTour } from '@/hooks/useExportTour';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { getRrrTourReadiness } from '@/rrr';
import { listDrafts } from '@/storage';
import type { StudioWorkflowSection } from './workflow/workflowTypes';

type DraftChangeHandler = (
  patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
) => void;

interface UseStudioControllerOptions {
  draft: TourDraft;
  onChange: DraftChangeHandler;
}

export function useStudioController({
  draft,
  onChange,
}: UseStudioControllerOptions) {
  const navigate = useNavigate();
  const { editorLanguage, setEditorLanguage, t } = useEditorLanguage();
  const [locale, setLocale] = useState<Locale>(editorLanguage);
  const [activeSection, setActiveSection] = useState<StudioWorkflowSection>(
    'plan',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const { exportingDraftId, exportError, runExport } = useExportTour();
  const exporting = exportingDraftId === draft.draftId;
  const drafts = useLiveQuery(() => listDrafts(), []);
  const rrrReadiness = useMemo(() => getRrrTourReadiness(draft), [draft]);

  useEffect(() => {
    setLocale(editorLanguage);
  }, [editorLanguage]);

  const changeLanguage = useCallback(
    (nextLocale: Locale) => {
      setLocale(nextLocale);
      setEditorLanguage(nextLocale);
    },
    [setEditorLanguage],
  );

  useEffect(() => {
    if (
      selectedId &&
      !draft.stations.some((station) => station.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [draft.stations, selectedId]);

  const selectByDelta = useCallback(
    (delta: -1 | 1) => {
      if (!selectedId) return;
      const currentIndex = draft.stations.findIndex(
        (station) => station.id === selectedId,
      );
      const nextIndex = currentIndex + delta;
      if (nextIndex < 0 || nextIndex >= draft.stations.length) return;
      setSelectedId(draft.stations[nextIndex].id);
    },
    [draft.stations, selectedId],
  );

  const addStation = useCallback(() => {
    const stationId = createId('stn');
    onChange((prev) => {
      const number = prev.stations.length + 1;
      const station = emptyStation(stationId, number);
      return { ...prev, stations: [...prev.stations, station] };
    });
    setSelectedId(stationId);
    setActiveSection('stations');
  }, [onChange]);

  const reorderStations = useCallback(
    (sourceId: string, targetId: string) => {
      onChange((prev) => {
        const list = [...prev.stations];
        const from = list.findIndex((station) => station.id === sourceId);
        const to = list.findIndex((station) => station.id === targetId);
        if (from < 0 || to < 0 || from === to) return prev;
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        return {
          ...prev,
          stations: list.map((station, index) => ({
            ...station,
            number: index + 1,
          })),
        };
      });
    },
    [onChange],
  );

  const changeSection = useCallback((next: StudioWorkflowSection) => {
    setActiveSection(next);
    if (next === 'stations') {
      setSelectedId(null);
    }
  }, []);

  const selectStation = useCallback((stationId: string) => {
    setSelectedId(stationId);
    setActiveSection('stations');
  }, []);

  const selectStationOnly = useCallback((stationId: string) => {
    setSelectedId(stationId);
  }, []);

  const toggleReorder = useCallback(() => {
    setActiveSection('stations');
    setReorderMode((value) => !value);
  }, []);

  const closeJumpPalette = useCallback(() => {
    setJumpOpen(false);
  }, []);

  const selectJumpStation = useCallback((stationId: string) => {
    setSelectedId(stationId);
    setJumpOpen(false);
  }, []);

  const selectTour = useCallback(
    (draftId: string) => {
      if (draftId !== draft.draftId) {
        navigate(`/tours/${draftId}`);
      }
    },
    [draft.draftId, navigate],
  );

  const backToTours = useCallback(() => {
    navigate('/tours');
  }, [navigate]);

  const selectTourOverview = useCallback(() => {
    setActiveSection('plan');
  }, []);

  const exportDraft = useCallback(() => {
    runExport(draft, { locale });
  }, [draft, locale, runExport]);

  // Keyboard shortcuts only apply while the Stations workspace is active:
  // left/right switch station, R toggles reorder, Cmd/Ctrl+K opens jump palette.
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT';

      if (
        activeSection === 'stations' &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setJumpOpen(true);
        return;
      }
      if (event.key === 'Escape' && jumpOpen) {
        setJumpOpen(false);
        return;
      }
      if (isTyping) return;
      if (activeSection !== 'stations') return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        selectByDelta(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        selectByDelta(1);
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setReorderMode((value) => !value);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeSection, jumpOpen, selectByDelta]);

  return {
    locale,
    activeSection,
    selectedId,
    reorderMode,
    jumpOpen,
    exporting,
    exportError,
    drafts,
    rrrReadiness,
    t,
    actions: {
      addStation,
      backToTours,
      changeLanguage,
      changeSection,
      closeJumpPalette,
      exportDraft,
      reorderStations,
      selectJumpStation,
      selectStation,
      selectStationOnly,
      selectTour,
      selectTourOverview,
      toggleReorder,
    },
  };
}
