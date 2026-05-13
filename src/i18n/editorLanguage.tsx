/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/schema';

const STORAGE_KEY = 'stq.editorLanguage';

export type EditorTextKey =
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
  | 'studio.noLocation'
  | 'studio.location'
  | 'studio.locationPlaceholder'
  | 'studio.tour'
  | 'studio.authorTool'
  | 'studio.tourStructure'
  | 'studio.tourOverview'
  | 'studio.introPage'
  | 'studio.outroPage'
  | 'studio.map'
  | 'studio.tourProfile'
  | 'studio.theme'
  | 'studio.audience'
  | 'studio.practical'
  | 'studio.stations'
  | 'studio.station'
  | 'studio.place'
  | 'studio.places'
  | 'studio.addStation'
  | 'studio.sort'
  | 'studio.done'
  | 'studio.languages'
  | 'studio.autoTranslate'
  | 'studio.autoTranslateHint'
  | 'studio.manualLanguage'
  | 'studio.chooseLanguage'
  | 'studio.german'
  | 'studio.english'
  | 'studio.italian'
  | 'studio.canvasHint'
  | 'studio.appPreview'
  | 'studio.tourListPreview'
  | 'studio.greeting'
  | 'studio.yourTours'
  | 'studio.welcomeMessage'
  | 'studio.welcomeMessageEdit'
  | 'studio.welcomeMessagePlaceholder'
  | 'studio.tourCover'
  | 'studio.tourImage'
  | 'studio.stationImage'
  | 'studio.stationIcon'
  | 'studio.iconSelected'
  | 'studio.addIcon'
  | 'studio.stationTitle'
  | 'studio.stationName'
  | 'studio.storyHeading'
  | 'studio.storyHeadingPlaceholder'
  | 'studio.iconLabel'
  | 'studio.storyParagraphsTitle'
  | 'studio.paragraphPlaceholder'
  | 'studio.historySectionTitle'
  | 'studio.riddleSettings'
  | 'studio.riddleSettingsHint'
  | 'studio.takePhoto'
  | 'studio.upload'
  | 'studio.imageSelected'
  | 'studio.chooseImage'
  | 'studio.imageFormatHint'
  | 'studio.imageUrlPlaceholder'
  | 'studio.tourStats'
  | 'studio.difficulty'
  | 'studio.difficultyEasy'
  | 'studio.difficultyMedium'
  | 'studio.difficultyHard'
  | 'studio.infos'
  | 'studio.infoWheelchair'
  | 'studio.infoParking'
  | 'studio.infoDogs'
  | 'studio.infoStroller'
  | 'studio.infoToilet'
  | 'studio.infoRefreshments'
  | 'studio.infoDrinkingWater'
  | 'studio.infoShade'
  | 'studio.infoNew'
  | 'studio.noCoverImage'
  | 'studio.coverImage'
  | 'studio.coverImageEdit'
  | 'studio.imagePath'
  | 'studio.title'
  | 'studio.titleLocation'
  | 'studio.titleLocationEdit'
  | 'studio.description'
  | 'studio.descriptionEdit'
  | 'studio.shortDescription'
  | 'studio.shortDescriptionPlaceholder'
  | 'studio.metaEdit'
  | 'studio.duration'
  | 'studio.durationPlaceholder'
  | 'studio.distance'
  | 'studio.distancePlaceholder'
  | 'studio.durationDistance'
  | 'studio.addDurationDistance'
  | 'studio.createNewTour'
  | 'studio.deleteTour'
  | 'studio.deleteTourConfirmTitle'
  | 'studio.deleteTourConfirmMessage'
  | 'studio.deleteTourConfirmAction'
  | 'studio.tourDeleted'
  | 'studio.back'
  | 'studio.language'
  | 'studio.outro'
  | 'studio.introMissing'
  | 'studio.introText'
  | 'studio.outroText'
  | 'studio.keyDataLines'
  | 'studio.lines'
  | 'studio.linesMissing'
  | 'studio.linePlaceholder'
  | 'studio.themeDescription'
  | 'studio.themeDescriptionPlaceholder'
  | 'studio.preStartHints'
  | 'studio.preStartHintsDefaultTitle'
  | 'studio.heading'
  | 'studio.hints'
  | 'studio.showHint'
  | 'studio.noHint'
  | 'studio.hintLevels'
  | 'studio.preStartHintPlaceholder'
  | 'studio.preStartHintSafety'
  | 'studio.preStartHintNature'
  | 'studio.preStartHintDaylight'
  | 'studio.privacyPolicy'
  | 'studio.acceptTerms'
  | 'studio.paragraphsOnePerEntry'
  | 'studio.addEntry'
  | 'studio.moveUp'
  | 'studio.moveDown'
  | 'studio.deleteEntry'
  | 'studio.startTour'
  | 'studio.resetTour'
  | 'studio.otherToursCta'
  | 'studio.backToTourList'
  | 'studio.noStations'
  | 'studio.editStation'
  | 'studio.locationTitle'
  | 'studio.stationStory'
  | 'studio.stationStoryPlaceholder'
  | 'studio.historicalContext'
  | 'studio.historicalContextPlaceholder'
  | 'studio.riddle'
  | 'studio.riddlePlaceholder'
  | 'studio.acceptedAnswers'
  | 'studio.acceptedAnswersPlaceholder'
  | 'studio.hint1'
  | 'studio.hint2'
  | 'studio.hint3'
  | 'studio.hint1Placeholder'
  | 'studio.hint2Placeholder'
  | 'studio.hint3Placeholder'
  | 'studio.stationEmptyHint'
  | 'studio.points'
  | 'studio.checkRoute'
  | 'studio.checkRouteCopy'
  | 'studio.edit'
  | 'studio.close'
  | 'studio.cancel'
  | 'studio.save'
  | 'workflow.plan'
  | 'workflow.story'
  | 'workflow.stations'
  | 'workflow.route'
  | 'workflow.ready'
  | 'workflow.attention'
  | 'workflow.empty'
  | 'rrr.module'
  | 'rrr.module.plural'
  | 'rrr.condition'
  | 'rrr.condition.plural'
  | 'rrr.interaction'
  | 'rrr.type.sequence'
  | 'rrr.type.all_of'
  | 'rrr.type.any_of'
  | 'rrr.expertMode'
  | 'rrr.expertModeHint';

export type EditorText = Record<EditorTextKey, string>;

const localeLoaders: Record<Locale, () => Promise<{ default: EditorText }>> = {
  de: () => import('./locales/de'),
  en: () => import('./locales/en'),
  it: () => import('./locales/it'),
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
  const [messages, setMessages] = useState<EditorText | null>(null);

  useEffect(() => {
    let cancelled = false;

    setMessages(null);
    localeLoaders[editorLanguage]()
      .then((module) => {
        if (!cancelled) {
          setMessages(module.default);
        }
      })
      .catch((error) => {
        console.error(`Failed to load editor locale: ${editorLanguage}`, error);
        if (editorLanguage === DEFAULT_LOCALE) {
          return;
        }
        return localeLoaders[DEFAULT_LOCALE]().then((module) => {
          if (!cancelled) {
            setMessages(module.default);
          }
        });
      })
      .catch((error) => {
        console.error(`Failed to load fallback editor locale: ${DEFAULT_LOCALE}`, error);
      });

    return () => {
      cancelled = true;
    };
  }, [editorLanguage]);

  const value = useMemo<EditorLanguageContextValue>(() => {
    function setEditorLanguage(locale: Locale) {
      setEditorLanguageState(locale);
      window.localStorage.setItem(STORAGE_KEY, locale);
    }

    return {
      editorLanguage,
      setEditorLanguage,
      t: (key) => messages?.[key] ?? key,
    };
  }, [editorLanguage, messages]);

  if (!messages) {
    return null;
  }

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
