/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/schema';

const STORAGE_KEY = 'stq.editorLanguage';

type EditorTextKey =
  | 'app.mobileFirst'
  | 'app.tours'
  | 'list.badge'
  | 'list.heroTitle'
  | 'list.heroEmphasis'
  | 'list.heroLead'
  | 'list.editorLanguage'
  | 'list.startNewTour'
  | 'list.offline'
  | 'list.localDrafts'
  | 'list.chooseTour'
  | 'list.search'
  | 'list.filterAll'
  | 'list.filterDrafting'
  | 'list.filterDraft'
  | 'list.filterDone'
  | 'list.newTour'
  | 'list.loading'
  | 'list.noMatches'
  | 'list.noDrafts'
  | 'list.emptyCopy'
  | 'studio.backToTours'
  | 'studio.savedLocally'
  | 'studio.justNow'
  | 'studio.minutesAgo'
  | 'studio.hoursAgo'
  | 'studio.daysAgo'
  | 'studio.fieldMode'
  | 'studio.exportZip'
  | 'studio.exporting'
  | 'studio.untitledTour'
  | 'workflow.plan'
  | 'workflow.story'
  | 'workflow.stations'
  | 'workflow.route'
  | 'workflow.preview'
  | 'workflow.ready'
  | 'workflow.attention'
  | 'workflow.empty';

type EditorText = Record<EditorTextKey, string>;

const TEXT: Record<Locale, EditorText> = {
  en: {
    'app.mobileFirst': 'Mobile-first',
    'app.tours': 'Tours',
    'list.badge': 'Field Authoring · v0.1',
    'list.heroTitle': 'Build the tour on the street,',
    'list.heroEmphasis': 'not later at a desk.',
    'list.heroLead':
      'Capture a place, write the story, test the riddle, and walk the route with the same visual language the tourist will see in the native app.',
    'list.editorLanguage': 'Editor language',
    'list.startNewTour': 'Start a new tour',
    'list.offline': 'Works offline · installable PWA',
    'list.localDrafts': 'Local drafts',
    'list.chooseTour': 'Choose a tour',
    'list.search': 'Search places, titles...',
    'list.filterAll': 'All',
    'list.filterDrafting': 'Drafting',
    'list.filterDraft': 'Draft',
    'list.filterDone': 'Done',
    'list.newTour': 'New tour',
    'list.loading': 'Loading...',
    'list.noMatches': 'No tours match the current search or filter.',
    'list.noDrafts': 'No drafts yet',
    'list.emptyCopy':
      'Start the first tour draft and use the phone workflow to capture places, stories, riddles, and the walked route.',
    'studio.backToTours': 'Back to tours',
    'studio.savedLocally': 'Saved locally',
    'studio.justNow': 'just now',
    'studio.minutesAgo': 'm ago',
    'studio.hoursAgo': 'h ago',
    'studio.daysAgo': 'd ago',
    'studio.fieldMode': 'Field mode',
    'studio.exportZip': 'Export ZIP',
    'studio.exporting': 'Exporting...',
    'studio.untitledTour': 'Untitled tour',
    'workflow.plan': 'Plan',
    'workflow.story': 'Story',
    'workflow.stations': 'Stations',
    'workflow.route': 'Route',
    'workflow.preview': 'Preview',
    'workflow.ready': 'Ready',
    'workflow.attention': 'Needs attention',
    'workflow.empty': 'Empty',
  },
  de: {
    'app.mobileFirst': 'Mobil zuerst',
    'app.tours': 'Touren',
    'list.badge': 'Feld-Authoring · v0.1',
    'list.heroTitle': 'Baue die Tour vor Ort,',
    'list.heroEmphasis': 'nicht später am Schreibtisch.',
    'list.heroLead':
      'Erfasse einen Ort, schreibe die Geschichte, teste das Rätsel und laufe die Route mit derselben visuellen Sprache, die Gäste in der App sehen.',
    'list.editorLanguage': 'Sprache der Oberfläche',
    'list.startNewTour': 'Neue Tour starten',
    'list.offline': 'Funktioniert offline · installierbare PWA',
    'list.localDrafts': 'Lokale Entwürfe',
    'list.chooseTour': 'Tour auswählen',
    'list.search': 'Orte, Titel suchen...',
    'list.filterAll': 'Alle',
    'list.filterDrafting': 'In Arbeit',
    'list.filterDraft': 'Entwurf',
    'list.filterDone': 'Fertig',
    'list.newTour': 'Neue Tour',
    'list.loading': 'Lädt...',
    'list.noMatches': 'Keine Tour passt zur aktuellen Suche oder zum Filter.',
    'list.noDrafts': 'Noch keine Entwürfe',
    'list.emptyCopy':
      'Starte den ersten Tour-Entwurf und nutze den Telefon-Workflow, um Orte, Geschichten, Rätsel und die gelaufene Route zu erfassen.',
    'studio.backToTours': 'Zurück zu den Touren',
    'studio.savedLocally': 'Lokal gespeichert',
    'studio.justNow': 'gerade eben',
    'studio.minutesAgo': 'Min. her',
    'studio.hoursAgo': 'Std. her',
    'studio.daysAgo': 'Tg. her',
    'studio.fieldMode': 'Feldmodus',
    'studio.exportZip': 'ZIP exportieren',
    'studio.exporting': 'Exportiert...',
    'studio.untitledTour': 'Unbenannte Tour',
    'workflow.plan': 'Plan',
    'workflow.story': 'Story',
    'workflow.stations': 'Stationen',
    'workflow.route': 'Route',
    'workflow.preview': 'Vorschau',
    'workflow.ready': 'Bereit',
    'workflow.attention': 'Braucht Aufmerksamkeit',
    'workflow.empty': 'Leer',
  },
  it: {
    'app.mobileFirst': 'Mobile-first',
    'app.tours': 'Tour',
    'list.badge': 'Authoring sul campo · v0.1',
    'list.heroTitle': 'Costruisci il tour sul posto,',
    'list.heroEmphasis': 'non dopo alla scrivania.',
    'list.heroLead':
      'Raccogli un luogo, scrivi la storia, testa l’indovinello e percorri l’itinerario con lo stesso linguaggio visivo che il turista vedra nell’app.',
    'list.editorLanguage': 'Lingua dell’interfaccia',
    'list.startNewTour': 'Inizia un nuovo tour',
    'list.offline': 'Funziona offline · PWA installabile',
    'list.localDrafts': 'Bozze locali',
    'list.chooseTour': 'Scegli un tour',
    'list.search': 'Cerca luoghi, titoli...',
    'list.filterAll': 'Tutti',
    'list.filterDrafting': 'In lavorazione',
    'list.filterDraft': 'Bozza',
    'list.filterDone': 'Pronto',
    'list.newTour': 'Nuovo tour',
    'list.loading': 'Caricamento...',
    'list.noMatches': 'Nessun tour corrisponde alla ricerca o al filtro.',
    'list.noDrafts': 'Nessuna bozza',
    'list.emptyCopy':
      'Inizia la prima bozza del tour e usa il flusso mobile per raccogliere luoghi, storie, indovinelli e il percorso camminato.',
    'studio.backToTours': 'Torna ai tour',
    'studio.savedLocally': 'Salvato localmente',
    'studio.justNow': 'adesso',
    'studio.minutesAgo': 'min fa',
    'studio.hoursAgo': 'h fa',
    'studio.daysAgo': 'g fa',
    'studio.fieldMode': 'Modalita campo',
    'studio.exportZip': 'Esporta ZIP',
    'studio.exporting': 'Esportazione...',
    'studio.untitledTour': 'Tour senza titolo',
    'workflow.plan': 'Piano',
    'workflow.story': 'Storia',
    'workflow.stations': 'Stazioni',
    'workflow.route': 'Percorso',
    'workflow.preview': 'Anteprima',
    'workflow.ready': 'Pronto',
    'workflow.attention': 'Richiede attenzione',
    'workflow.empty': 'Vuoto',
  },
};

interface EditorLanguageContextValue {
  editorLanguage: Locale;
  setEditorLanguage: (locale: Locale) => void;
  t: (key: EditorTextKey) => string;
}

const EditorLanguageContext =
  createContext<EditorLanguageContextValue | null>(null);

export function EditorLanguageProvider({ children }: { children: ReactNode }) {
  const [editorLanguage, setEditorLanguageState] = useState<Locale>(
    readStoredLanguage,
  );

  const value = useMemo<EditorLanguageContextValue>(() => {
    function setEditorLanguage(locale: Locale) {
      setEditorLanguageState(locale);
      window.localStorage.setItem(STORAGE_KEY, locale);
    }

    return {
      editorLanguage,
      setEditorLanguage,
      t: (key) => TEXT[editorLanguage][key],
    };
  }, [editorLanguage]);

  return (
    <EditorLanguageContext.Provider value={value}>
      {children}
    </EditorLanguageContext.Provider>
  );
}

export function useEditorLanguage() {
  const context = useContext(EditorLanguageContext);
  if (!context) {
    throw new Error('useEditorLanguage must be used inside EditorLanguageProvider.');
  }
  return context;
}

function readStoredLanguage(): Locale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LOCALES.includes(stored as Locale) ? (stored as Locale) : DEFAULT_LOCALE;
}
