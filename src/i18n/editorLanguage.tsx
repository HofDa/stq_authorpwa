/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/schema/locales';

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
  | 'rrr.expertModeHint'
  | 'rrr.editor.title'
  | 'rrr.editor.condition.none'
  | 'rrr.editor.condition.module'
  | 'rrr.editor.condition.sequence'
  | 'rrr.editor.condition.allOf'
  | 'rrr.editor.condition.anyOf'
  | 'rrr.editor.compass.north'
  | 'rrr.editor.compass.east'
  | 'rrr.editor.compass.south'
  | 'rrr.editor.compass.west'
  | 'rrr.editor.compass.near'
  | 'rrr.editor.summary.modules'
  | 'rrr.editor.addModule'
  | 'rrr.editor.add'
  | 'rrr.editor.emptyModules'
  | 'rrr.editor.validation.valid'
  | 'rrr.editor.validation.invalid'
  | 'rrr.editor.preset.fallbackRecommended'
  | 'rrr.editor.preset.robust'
  | 'rrr.editor.preset.fieldTest'
  | 'rrr.editor.difficulty.easy'
  | 'rrr.editor.difficulty.medium'
  | 'rrr.editor.difficulty.advanced'
  | 'rrr.editor.reliability.high'
  | 'rrr.editor.reliability.medium'
  | 'rrr.editor.reliability.deviceDependent'
  | 'rrr.editor.condition.description'
  | 'rrr.editor.condition.type'
  | 'rrr.editor.condition.emptyModules'
  | 'rrr.editor.condition.unsupported'
  | 'rrr.editor.condition.reset'
  | 'rrr.editor.condition.invalidReference'
  | 'rrr.editor.condition.invalidReferences'
  | 'rrr.editor.condition.deletedModule'
  | 'rrr.editor.condition.moduleLabel'
  | 'rrr.editor.condition.stepLabel'
  | 'rrr.editor.condition.missingStepModule'
  | 'rrr.editor.condition.stepModuleAria'
  | 'rrr.editor.condition.newStepModuleAria'
  | 'rrr.editor.condition.addStep'
  | 'rrr.editor.module.directionHotcoldToleranceLabel'
  | 'rrr.editor.module.directionHotcoldToleranceHint'
  | 'rrr.editor.module.proximityRadiusLabel'
  | 'rrr.editor.module.proximityRadiusHint'
  | 'rrr.editor.fallback.label'
  | 'rrr.editor.fallback.none'
  | 'rrr.editor.fallback.missing'
  | 'rrr.editor.fallback.hint'
  | 'rrr.editor.fallback.suggestionAria'
  | 'rrr.editor.fallback.suggestionTitle'
  | 'rrr.editor.fallback.suggestionDescription'
  | 'rrr.editor.fallback.create'
  | 'rrr.editor.fallback.generatedLabel'
  | 'rrr.editor.textAnswer.aria'
  | 'rrr.editor.textAnswer.eyebrow'
  | 'rrr.editor.textAnswer.set'
  | 'rrr.editor.textAnswer.missing'
  | 'rrr.editor.textAnswer.label'
  | 'rrr.editor.textAnswer.placeholder'
  | 'rrr.editor.textAnswer.hint'
  | 'rrr.editor.textAnswer.warning'
  | 'rrr.editor.case.exact'
  | 'rrr.editor.case.flexible'
  | 'rrr.editor.case.respect'
  | 'rrr.editor.case.important'
  | 'rrr.editor.case.ignored'
  | 'rrr.editor.multiChoice.aria'
  | 'rrr.editor.multiChoice.eyebrow'
  | 'rrr.editor.multiChoice.ready'
  | 'rrr.editor.multiChoice.missing'
  | 'rrr.editor.multiChoice.multiple'
  | 'rrr.editor.multiChoice.single'
  | 'rrr.editor.multiChoice.question'
  | 'rrr.editor.multiChoice.questionPlaceholder'
  | 'rrr.editor.multiChoice.allowMultiple'
  | 'rrr.editor.multiChoice.correctAria'
  | 'rrr.editor.multiChoice.correct'
  | 'rrr.editor.multiChoice.optionPlaceholder'
  | 'rrr.editor.multiChoice.addOption'
  | 'rrr.editor.multiChoice.warning'
  | 'rrr.editor.multiChoice.optionsSummary'
  | 'rrr.editor.hold.aria'
  | 'rrr.editor.hold.duration'
  | 'rrr.editor.hold.slider'
  | 'rrr.editor.hold.presetsAria'
  | 'rrr.editor.hold.expertLabel'
  | 'rrr.editor.compass.aria'
  | 'rrr.editor.compass.selected'
  | 'rrr.editor.compass.presetsAria'
  | 'rrr.editor.compass.defaultToleranceLabel'
  | 'rrr.editor.compass.defaultToleranceHint'
  | 'rrr.editor.compass.toleranceDegrees'
  | 'rrr.editor.compass.targetDegrees'
  | 'rrr.editor.gps.lat'
  | 'rrr.editor.gps.lng'
  | 'rrr.editor.gps.radius'
  | 'rrr.editor.gps.aria'
  | 'rrr.editor.gps.slider'
  | 'rrr.editor.gps.meters'
  | 'rrr.editor.gps.calibration'
  | 'rrr.editor.gps.radiusPrecise'
  | 'rrr.editor.gps.radiusPreciseHint'
  | 'rrr.editor.gps.radiusNormal'
  | 'rrr.editor.gps.radiusNormalHint'
  | 'rrr.editor.gps.radiusForgiving'
  | 'rrr.editor.gps.radiusForgivingHint'
  | 'rrr.editor.qr.aria'
  | 'rrr.editor.qr.eyebrow'
  | 'rrr.editor.qr.set'
  | 'rrr.editor.qr.missing'
  | 'rrr.editor.qr.exact'
  | 'rrr.editor.qr.expected'
  | 'rrr.editor.qr.placeholder'
  | 'rrr.editor.qr.hint'
  | 'rrr.editor.qr.cameraTitle'
  | 'rrr.editor.qr.cameraHint'
  | 'rrr.editor.qr.warning'
  | 'rrr.editor.codeWord.aria'
  | 'rrr.editor.codeWord.eyebrow'
  | 'rrr.editor.codeWord.set'
  | 'rrr.editor.codeWord.missing'
  | 'rrr.editor.codeWord.label'
  | 'rrr.editor.codeWord.placeholder'
  | 'rrr.editor.codeWord.hint'
  | 'rrr.editor.codeWord.warning'
  | 'rrr.editor.sequential.aria'
  | 'rrr.editor.sequential.eyebrow'
  | 'rrr.editor.sequential.set'
  | 'rrr.editor.sequential.missing'
  | 'rrr.editor.sequential.code'
  | 'rrr.editor.sequential.codePlaceholder'
  | 'rrr.editor.sequential.hint'
  | 'rrr.editor.sequential.hintLabel'
  | 'rrr.editor.sequential.hintPlaceholder'
  | 'rrr.editor.sequential.noHint'
  | 'rrr.editor.sequential.warning'
  | 'rrr.editor.timer.aria'
  | 'rrr.editor.timer.wait'
  | 'rrr.editor.timer.slider'
  | 'rrr.editor.timer.presetsAria'
  | 'rrr.editor.timer.expertLabel'
  | 'rrr.editor.manual.confirmation'
  | 'rrr.editor.manual.instruction'
  | 'rrr.editor.manual.confirmLabel'
  | 'rrr.editor.manual.confirmPlaceholderFound'
  | 'rrr.editor.manual.confirmPlaceholderConfirmed'
  | 'rrr.editor.manual.confirmHint'
  | 'rrr.editor.object.aria'
  | 'rrr.editor.object.eyebrow'
  | 'rrr.editor.object.set'
  | 'rrr.editor.object.missing'
  | 'rrr.editor.object.placeholder'
  | 'rrr.editor.object.hint'
  | 'rrr.editor.object.warning'
  | 'rrr.editor.photo.aria'
  | 'rrr.editor.photo.eyebrow'
  | 'rrr.editor.photo.set'
  | 'rrr.editor.photo.missing'
  | 'rrr.editor.photo.placeholder'
  | 'rrr.editor.photo.hint'
  | 'rrr.editor.photo.warning'
  | 'rrr.editor.card.textAnswerTitle'
  | 'rrr.editor.card.textAnswerDescription'
  | 'rrr.editor.card.multiChoiceTitle'
  | 'rrr.editor.card.multiChoiceDescription'
  | 'rrr.editor.card.gpsTitle'
  | 'rrr.editor.card.gpsDescription'
  | 'rrr.editor.card.proximityTitle'
  | 'rrr.editor.card.proximityDescription'
  | 'rrr.editor.card.compassTitle'
  | 'rrr.editor.card.compassDescription'
  | 'rrr.editor.card.directionHotcoldTitle'
  | 'rrr.editor.card.directionHotcoldDescription'
  | 'rrr.editor.card.holdStillTitle'
  | 'rrr.editor.card.holdStillDescription'
  | 'rrr.editor.card.qrTitle'
  | 'rrr.editor.card.qrDescription'
  | 'rrr.editor.card.codeWordTitle'
  | 'rrr.editor.card.codeWordDescription'
  | 'rrr.editor.card.sequentialTitle'
  | 'rrr.editor.card.sequentialDescription'
  | 'rrr.editor.card.timerTitle'
  | 'rrr.editor.card.timerDescription'
  | 'rrr.editor.card.photoTitle'
  | 'rrr.editor.card.photoDescription'
  | 'rrr.editor.card.objectTitle'
  | 'rrr.editor.card.objectDescription'
  | 'rrr.editor.summary.answer'
  | 'rrr.editor.summary.notSet'
  | 'rrr.editor.summary.question'
  | 'rrr.editor.summary.options'
  | 'rrr.editor.summary.coordinatesMissing'
  | 'rrr.editor.summary.target'
  | 'rrr.editor.summary.radius'
  | 'rrr.editor.summary.successRadius'
  | 'rrr.editor.summary.direction'
  | 'rrr.editor.summary.tolerance'
  | 'rrr.editor.summary.successTolerance'
  | 'rrr.editor.summary.duration'
  | 'rrr.editor.summary.qrValue'
  | 'rrr.editor.summary.codeWord'
  | 'rrr.editor.summary.code'
  | 'rrr.editor.summary.hint'
  | 'rrr.editor.summary.wait'
  | 'rrr.editor.summary.instruction'
  | 'rrr.editor.summary.button'
  | 'rrr.editor.number.invalid'
  | 'rrr.editor.duration.short'
  | 'rrr.editor.duration.shortHint'
  | 'rrr.editor.duration.normal'
  | 'rrr.editor.duration.normalHint'
  | 'rrr.editor.duration.long'
  | 'rrr.editor.duration.longHint'
  | 'rrr.editor.wait.short'
  | 'rrr.editor.wait.shortHint'
  | 'rrr.editor.wait.normal'
  | 'rrr.editor.wait.normalHint'
  | 'rrr.editor.wait.long'
  | 'rrr.editor.wait.longHint';

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
    return <EditorLanguageLoadingState />;
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

function EditorLanguageLoadingState() {
  return (
    <div role="status" aria-live="polite" className="stq-loading-shell">
      <p className="text-bodySm text-disabled">Loading language...</p>
    </div>
  );
}
