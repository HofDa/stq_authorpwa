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
    'studio.noLocation': 'No location',
    'studio.location': 'Location',
    'studio.locationPlaceholder': 'e.g. Merano, South Tyrol',
    'studio.tour': 'Tour',
    'studio.authorTool': 'Author Tool',
    'studio.tourStructure': 'Tour structure',
    'studio.tourOverview': 'Tour overview',
    'studio.introPage': 'Intro page',
    'studio.outroPage': 'Outro page',
    'studio.map': 'Map',
    'studio.tourProfile': 'Tour profile',
    'studio.theme': 'Theme',
    'studio.audience': 'Audience',
    'studio.practical': 'Practical',
    'studio.stations': 'Stations',
    'studio.station': 'Station',
    'studio.place': 'Place',
    'studio.places': 'Places',
    'studio.addStation': 'Add station',
    'studio.sort': 'Sort',
    'studio.done': 'Done',
    'studio.languages': 'Languages',
    'studio.autoTranslate': 'Translate content with AI',
    'studio.autoTranslateHint': 'Translations are generated automatically',
    'studio.manualLanguage': 'Adjust content manually',
    'studio.chooseLanguage': 'Choose language',
    'studio.german': 'German',
    'studio.english': 'English',
    'studio.italian': 'Italian',
    'studio.canvasHint':
      'Hover over text, images and content - click the pen to edit',
    'studio.appPreview': 'App preview',
    'studio.tourListPreview': 'Tour overview',
    'studio.greeting': 'Hello!',
    'studio.yourTours': 'Your tours',
    'studio.welcomeMessage': 'Welcome message',
    'studio.welcomeMessageEdit': 'Edit welcome message',
    'studio.welcomeMessagePlaceholder': 'Pick a tour and start your adventure.',
    'studio.tourCover': 'Tour cover',
    'studio.tourImage': 'Tour image',
    'studio.takePhoto': 'Take photo',
    'studio.upload': 'Upload',
    'studio.imageSelected': 'Image selected',
    'studio.chooseImage': 'Choose image',
    'studio.imageFormatHint': 'PNG, JPG, or paste a URL',
    'studio.imageUrlPlaceholder': '...or paste an image URL',
    'studio.tourStats': 'Tour stats',
    'studio.difficulty': 'Difficulty',
    'studio.difficultyEasy': 'Easy',
    'studio.difficultyMedium': 'Medium',
    'studio.difficultyHard': 'Hard',
    'studio.infos': 'Info',
    'studio.infoWheelchair': 'Wheelchair friendly',
    'studio.infoParking': 'Parking available',
    'studio.infoDogs': 'Dog friendly',
    'studio.infoStroller': 'Stroller friendly',
    'studio.infoToilet': 'Toilet available',
    'studio.infoRefreshments': 'Refreshments nearby',
    'studio.infoDrinkingWater': 'Drinking water',
    'studio.infoShade': 'Lots of shade',
    'studio.infoNew': 'New',
    'studio.noCoverImage': 'No cover image',
    'studio.coverImage': 'Cover image',
    'studio.coverImageEdit': 'Edit cover image',
    'studio.imagePath': 'Image path (temporary)',
    'studio.title': 'Title',
    'studio.titleLocation': 'Title & location',
    'studio.titleLocationEdit': 'Edit title and location',
    'studio.description': 'Description',
    'studio.descriptionEdit': 'Edit description',
    'studio.shortDescription': 'Short description',
    'studio.shortDescriptionPlaceholder': 'Description for players...',
    'studio.metaEdit': 'Edit metadata',
    'studio.duration': 'Duration',
    'studio.durationPlaceholder': 'e.g. 2-3 hours',
    'studio.distance': 'Distance',
    'studio.distancePlaceholder': 'e.g. 4.5 km',
    'studio.durationDistance': 'Duration & distance',
    'studio.addDurationDistance': 'Add duration & distance',
    'studio.createNewTour': 'Create new tour',
    'studio.back': 'Back',
    'studio.language': 'Language',
    'studio.outro': 'Outro',
    'studio.introMissing':
      'Add intro text so players understand what the tour is about.',
    'studio.introText': 'Intro text',
    'studio.outroText': 'Outro text',
    'studio.keyDataLines': 'Key data / lines',
    'studio.lines': 'Lines',
    'studio.linesMissing': 'Add key lines like starting point, duration, or theme.',
    'studio.linePlaceholder': 'e.g. 📍 Starting point: Elisabeth Park, Merano',
    'studio.themeDescription': 'Theme description',
    'studio.themeDescriptionPlaceholder': 'e.g. Theme: Sisi in Merano and the rise of the spa town',
    'studio.preStartHints': 'Hints before tour start',
    'studio.preStartHintsDefaultTitle': 'Before you start, a few hints',
    'studio.heading': 'Heading',
    'studio.hints': 'Hints',
    'studio.preStartHintPlaceholder': 'e.g. Pay attention to your safety and traffic.',
    'studio.preStartHintSafety': 'Pay attention to your safety and traffic.',
    'studio.preStartHintNature': 'Respect nature and your surroundings.',
    'studio.preStartHintDaylight': 'The tour is only possible in daylight.',
    'studio.privacyPolicy': 'Privacy policy',
    'studio.acceptTerms': 'I accept the terms of use',
    'studio.paragraphsOnePerEntry': 'Paragraphs (one per entry)',
    'studio.addEntry': 'Add entry',
    'studio.moveUp': 'Move up',
    'studio.moveDown': 'Move down',
    'studio.deleteEntry': 'Delete entry',
    'studio.startTour': 'Start tour',
    'studio.resetTour': 'Reset tour',
    'studio.otherToursCta': 'To the other tours',
    'studio.backToTourList': 'Back to tour overview',
    'studio.noStations': 'No stations yet',
    'studio.editStation': 'Edit station',
    'studio.locationTitle': 'Location / title',
    'studio.stationStory': 'Story on site',
    'studio.stationStoryPlaceholder': 'What do players see at this place?',
    'studio.historicalContext': 'Historical context',
    'studio.historicalContextPlaceholder': 'Optional background text',
    'studio.riddle': 'Riddle',
    'studio.riddlePlaceholder': 'Riddle question or task',
    'studio.acceptedAnswers': 'Accepted answers',
    'studio.acceptedAnswersPlaceholder': 'Answer, alternative',
    'studio.hint1': 'Hint 1',
    'studio.hint2': 'Hint 2',
    'studio.hint3': 'Hint 3',
    'studio.hint1Placeholder': 'First hint',
    'studio.hint2Placeholder': 'Second hint',
    'studio.hint3Placeholder': 'Third hint',
    'studio.stationEmptyHint':
      'Tap here to edit story, riddle and hints.',
    'studio.points': 'points',
    'studio.checkRoute': 'Check route',
    'studio.checkRouteCopy':
      'Check the order, distance and transitions between stations.',
    'studio.edit': 'Edit',
    'studio.close': 'Close',
    'studio.cancel': 'Cancel',
    'studio.save': 'Save',
    'workflow.plan': 'Plan',
    'workflow.story': 'Story',
    'workflow.stations': 'Stations',
    'workflow.route': 'Route',
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
    'studio.noLocation': 'Kein Ort',
    'studio.location': 'Ort',
    'studio.locationPlaceholder': 'z. B. Meran, Südtirol',
    'studio.tour': 'Tour',
    'studio.authorTool': 'Author Tool',
    'studio.tourStructure': 'Tour-Aufbau',
    'studio.tourOverview': 'Tour-Übersicht',
    'studio.introPage': 'Intro-Seite',
    'studio.outroPage': 'Outro-Seite',
    'studio.map': 'Karte',
    'studio.tourProfile': 'Tour-Profil',
    'studio.theme': 'Thema',
    'studio.audience': 'Zielgruppe',
    'studio.practical': 'Praktisches',
    'studio.stations': 'Stationen',
    'studio.station': 'Station',
    'studio.place': 'Ort',
    'studio.places': 'Orte',
    'studio.addStation': 'Station hinzufügen',
    'studio.sort': 'Sortieren',
    'studio.done': 'Fertig',
    'studio.languages': 'Sprachen',
    'studio.autoTranslate': 'Inhalte mit KI übersetzen',
    'studio.autoTranslateHint': 'Übersetzungen werden automatisch erzeugt',
    'studio.manualLanguage': 'Inhalte manuell anpassen',
    'studio.chooseLanguage': 'Sprache wählen',
    'studio.german': 'Deutsch',
    'studio.english': 'Englisch',
    'studio.italian': 'Italienisch',
    'studio.canvasHint':
      'Hover über Texte, Bilder und Inhalte - klicke den Stift zum Bearbeiten',
    'studio.appPreview': 'App Vorschau',
    'studio.tourListPreview': 'Tourenübersicht',
    'studio.greeting': 'Hallo!',
    'studio.yourTours': 'Deine Touren',
    'studio.welcomeMessage': 'Willkommensnachricht',
    'studio.welcomeMessageEdit': 'Willkommensnachricht bearbeiten',
    'studio.welcomeMessagePlaceholder': 'Wähle eine Tour und starte dein Abenteuer.',
    'studio.tourCover': 'Tour-Cover',
    'studio.tourImage': 'Tour-Bild',
    'studio.takePhoto': 'Foto machen',
    'studio.upload': 'Hochladen',
    'studio.imageSelected': 'Bild ausgewählt',
    'studio.chooseImage': 'Bild auswählen',
    'studio.imageFormatHint': 'PNG, JPG, oder URL einfügen',
    'studio.imageUrlPlaceholder': '...oder Bild-URL einfügen',
    'studio.tourStats': 'Tour-Daten',
    'studio.difficulty': 'Schwierigkeitsgrad',
    'studio.difficultyEasy': 'Leicht',
    'studio.difficultyMedium': 'Mittel',
    'studio.difficultyHard': 'Schwer',
    'studio.infos': 'Infos',
    'studio.infoWheelchair': 'Rollstuhl-\nfreundlich',
    'studio.infoParking': 'Parken möglich',
    'studio.infoDogs': 'Hundefreundlich',
    'studio.infoStroller': 'Kinderwagen',
    'studio.infoToilet': 'WC vorhanden',
    'studio.infoRefreshments': 'Einkehr-\nmöglichkeit',
    'studio.infoDrinkingWater': 'Trinkwasser',
    'studio.infoShade': 'Viel Schatten',
    'studio.infoNew': 'Neu',
    'studio.noCoverImage': 'Kein Titelbild',
    'studio.coverImage': 'Titelbild',
    'studio.coverImageEdit': 'Titelbild bearbeiten',
    'studio.imagePath': 'Bild-Pfad (temporär)',
    'studio.title': 'Titel',
    'studio.titleLocation': 'Titel & Ort',
    'studio.titleLocationEdit': 'Titel und Ort bearbeiten',
    'studio.description': 'Beschreibung',
    'studio.descriptionEdit': 'Beschreibung bearbeiten',
    'studio.shortDescription': 'Kurzbeschreibung',
    'studio.shortDescriptionPlaceholder': 'Beschreibung der Tour für Spieler...',
    'studio.metaEdit': 'Metadaten bearbeiten',
    'studio.duration': 'Dauer',
    'studio.durationPlaceholder': 'z. B. 2-3 Stunden',
    'studio.distance': 'Distanz',
    'studio.distancePlaceholder': 'z. B. 4,5 km',
    'studio.durationDistance': 'Dauer & Distanz',
    'studio.addDurationDistance': 'Dauer & Distanz hinzufügen',
    'studio.createNewTour': 'Neue Tour erstellen',
    'studio.back': 'Zurück',
    'studio.language': 'Sprache',
    'studio.outro': 'Abschluss',
    'studio.introMissing':
      'Füge Intro-Text hinzu, damit Spieler wissen, worum es in der Tour geht.',
    'studio.introText': 'Einleitungstext',
    'studio.outroText': 'Abschlusstext',
    'studio.keyDataLines': 'Eckdaten / Lines',
    'studio.lines': 'Zeilen',
    'studio.linesMissing': 'Füge Eckdaten wie Startpunkt, Dauer oder Thema hinzu.',
    'studio.linePlaceholder': 'z. B. 📍 Startpunkt: Elisabethpark, Meran',
    'studio.themeDescription': 'Beschreibung Thema',
    'studio.themeDescriptionPlaceholder': 'z. B. Thema: Sisis Aufenthalt in Meran & die Entwicklung zur Kurstadt',
    'studio.preStartHints': 'Hinweise vor Tour-Start',
    'studio.preStartHintsDefaultTitle': 'Bevor es losgeht, noch ein paar Hinweise',
    'studio.heading': 'Überschrift',
    'studio.hints': 'Hinweise',
    'studio.preStartHintPlaceholder': 'z. B. Achte auf deine Sicherheit und den Verkehr.',
    'studio.preStartHintSafety': 'Achte auf deine Sicherheit und den Verkehr.',
    'studio.preStartHintNature': 'Respektiere Natur und Umgebung.',
    'studio.preStartHintDaylight': 'Die Tour ist nur bei Tageslicht möglich.',
    'studio.privacyPolicy': 'Datenschutzerklärung',
    'studio.acceptTerms': 'Ich akzeptiere die Nutzungsbedingungen',
    'studio.paragraphsOnePerEntry': 'Absätze (einer pro Eintrag)',
    'studio.addEntry': 'Eintrag hinzufügen',
    'studio.moveUp': 'Nach oben',
    'studio.moveDown': 'Nach unten',
    'studio.deleteEntry': 'Eintrag löschen',
    'studio.startTour': 'Tour starten',
    'studio.resetTour': 'Tour zurücksetzen',
    'studio.otherToursCta': 'Zu den anderen Touren',
    'studio.backToTourList': 'Zur Tourenübersicht',
    'studio.noStations': 'Noch keine Stationen',
    'studio.editStation': 'Station bearbeiten',
    'studio.locationTitle': 'Ort / Titel',
    'studio.stationStory': 'Story vor Ort',
    'studio.stationStoryPlaceholder': 'Was sehen Spieler an diesem Ort?',
    'studio.historicalContext': 'Historischer Kontext',
    'studio.historicalContextPlaceholder': 'Optionaler Hintergrundtext',
    'studio.riddle': 'Rätsel',
    'studio.riddlePlaceholder': 'Rätselfrage oder Aufgabe',
    'studio.acceptedAnswers': 'Akzeptierte Antworten',
    'studio.acceptedAnswersPlaceholder': 'Antwort, Alternative',
    'studio.hint1': 'Hinweis 1',
    'studio.hint2': 'Hinweis 2',
    'studio.hint3': 'Hinweis 3',
    'studio.hint1Placeholder': 'Erster Hinweis',
    'studio.hint2Placeholder': 'Zweiter Hinweis',
    'studio.hint3Placeholder': 'Dritter Hinweis',
    'studio.stationEmptyHint':
      'Tippe hier, um Story, Rätsel und Hinweise zu bearbeiten.',
    'studio.points': 'Punkte',
    'studio.checkRoute': 'Strecke prüfen',
    'studio.checkRouteCopy':
      'Kontrolliere Reihenfolge, Distanz und Übergänge zwischen den Stationen.',
    'studio.edit': 'Bearbeiten',
    'studio.close': 'Schließen',
    'studio.cancel': 'Abbrechen',
    'studio.save': 'Speichern',
    'workflow.plan': 'Plan',
    'workflow.story': 'Story',
    'workflow.stations': 'Stationen',
    'workflow.route': 'Route',
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
    'studio.noLocation': 'Nessun luogo',
    'studio.location': 'Luogo',
    'studio.locationPlaceholder': 'es. Merano, Alto Adige',
    'studio.tour': 'Tour',
    'studio.authorTool': 'Strumento autore',
    'studio.tourStructure': 'Struttura tour',
    'studio.tourOverview': 'Panoramica tour',
    'studio.introPage': 'Pagina introduttiva',
    'studio.outroPage': 'Pagina finale',
    'studio.map': 'Mappa',
    'studio.tourProfile': 'Profilo tour',
    'studio.theme': 'Tema',
    'studio.audience': 'Pubblico',
    'studio.practical': 'Pratico',
    'studio.stations': 'Stazioni',
    'studio.station': 'Stazione',
    'studio.place': 'Luogo',
    'studio.places': 'Luoghi',
    'studio.addStation': 'Aggiungi stazione',
    'studio.sort': 'Ordina',
    'studio.done': 'Fatto',
    'studio.languages': 'Lingue',
    'studio.autoTranslate': 'Traduci i contenuti con AI',
    'studio.autoTranslateHint': 'Le traduzioni vengono generate automaticamente',
    'studio.manualLanguage': 'Adatta i contenuti manualmente',
    'studio.chooseLanguage': 'Scegli lingua',
    'studio.german': 'Tedesco',
    'studio.english': 'Inglese',
    'studio.italian': 'Italiano',
    'studio.canvasHint':
      'Passa su testi, immagini e contenuti - clicca la penna per modificare',
    'studio.appPreview': 'Anteprima app',
    'studio.tourListPreview': 'Panoramica tour',
    'studio.greeting': 'Ciao!',
    'studio.yourTours': 'I tuoi tour',
    'studio.welcomeMessage': 'Messaggio di benvenuto',
    'studio.welcomeMessageEdit': 'Modifica messaggio di benvenuto',
    'studio.welcomeMessagePlaceholder': 'Scegli un tour e inizia la tua avventura.',
    'studio.tourCover': 'Copertina tour',
    'studio.tourImage': 'Immagine tour',
    'studio.takePhoto': 'Scatta foto',
    'studio.upload': 'Carica',
    'studio.imageSelected': 'Immagine selezionata',
    'studio.chooseImage': 'Scegli immagine',
    'studio.imageFormatHint': 'PNG, JPG, o incolla un URL',
    'studio.imageUrlPlaceholder': '...o incolla un URL immagine',
    'studio.tourStats': 'Dati tour',
    'studio.difficulty': 'Difficoltà',
    'studio.difficultyEasy': 'Facile',
    'studio.difficultyMedium': 'Medio',
    'studio.difficultyHard': 'Difficile',
    'studio.infos': 'Info',
    'studio.infoWheelchair': 'Accessibile',
    'studio.infoParking': 'Parcheggio',
    'studio.infoDogs': 'Cani ammessi',
    'studio.infoStroller': 'Passeggino',
    'studio.infoToilet': 'WC disponibile',
    'studio.infoRefreshments': 'Ristoro vicino',
    'studio.infoDrinkingWater': 'Acqua potabile',
    'studio.infoShade': 'Molta ombra',
    'studio.infoNew': 'Nuovo',
    'studio.noCoverImage': 'Nessuna immagine',
    'studio.coverImage': 'Immagine copertina',
    'studio.coverImageEdit': 'Modifica immagine copertina',
    'studio.imagePath': 'Percorso immagine (temporaneo)',
    'studio.title': 'Titolo',
    'studio.titleLocation': 'Titolo e luogo',
    'studio.titleLocationEdit': 'Modifica titolo e luogo',
    'studio.description': 'Descrizione',
    'studio.descriptionEdit': 'Modifica descrizione',
    'studio.shortDescription': 'Descrizione breve',
    'studio.shortDescriptionPlaceholder': 'Descrizione del tour per i giocatori...',
    'studio.metaEdit': 'Modifica metadati',
    'studio.duration': 'Durata',
    'studio.durationPlaceholder': 'es. 2-3 ore',
    'studio.distance': 'Distanza',
    'studio.distancePlaceholder': 'es. 4,5 km',
    'studio.durationDistance': 'Durata e distanza',
    'studio.addDurationDistance': 'Aggiungi durata e distanza',
    'studio.createNewTour': 'Crea nuovo tour',
    'studio.back': 'Indietro',
    'studio.language': 'Lingua',
    'studio.outro': 'Finale',
    'studio.introMissing':
      'Aggiungi un testo introduttivo cosi i giocatori capiscono il tour.',
    'studio.introText': 'Testo introduttivo',
    'studio.outroText': 'Testo finale',
    'studio.keyDataLines': 'Dati chiave / righe',
    'studio.lines': 'Righe',
    'studio.linesMissing': 'Aggiungi dati chiave come partenza, durata o tema.',
    'studio.linePlaceholder': 'es. 📍 Partenza: Parco Elisabetta, Merano',
    'studio.themeDescription': 'Descrizione tema',
    'studio.themeDescriptionPlaceholder': 'es. Tema: Sisi a Merano e lo sviluppo della citta termale',
    'studio.preStartHints': 'Avvisi prima del tour',
    'studio.preStartHintsDefaultTitle': 'Prima di iniziare, qualche avviso',
    'studio.heading': 'Titolo',
    'studio.hints': 'Avvisi',
    'studio.preStartHintPlaceholder': 'es. Fai attenzione alla sicurezza e al traffico.',
    'studio.preStartHintSafety': 'Fai attenzione alla sicurezza e al traffico.',
    'studio.preStartHintNature': 'Rispetta la natura e l ambiente.',
    'studio.preStartHintDaylight': 'Il tour e possibile solo alla luce del giorno.',
    'studio.privacyPolicy': 'Informativa privacy',
    'studio.acceptTerms': 'Accetto le condizioni d uso',
    'studio.paragraphsOnePerEntry': 'Paragrafi (uno per voce)',
    'studio.addEntry': 'Aggiungi voce',
    'studio.moveUp': 'Sposta su',
    'studio.moveDown': 'Sposta giu',
    'studio.deleteEntry': 'Elimina voce',
    'studio.startTour': 'Inizia tour',
    'studio.resetTour': 'Reimposta tour',
    'studio.otherToursCta': 'Agli altri tour',
    'studio.backToTourList': 'Torna alla panoramica tour',
    'studio.noStations': 'Nessuna stazione',
    'studio.editStation': 'Modifica stazione',
    'studio.locationTitle': 'Luogo / titolo',
    'studio.stationStory': 'Storia sul posto',
    'studio.stationStoryPlaceholder': 'Cosa vedono i giocatori in questo luogo?',
    'studio.historicalContext': 'Contesto storico',
    'studio.historicalContextPlaceholder': 'Testo di contesto opzionale',
    'studio.riddle': 'Indovinello',
    'studio.riddlePlaceholder': 'Domanda o compito dell indovinello',
    'studio.acceptedAnswers': 'Risposte accettate',
    'studio.acceptedAnswersPlaceholder': 'Risposta, alternativa',
    'studio.hint1': 'Aiuto 1',
    'studio.hint2': 'Aiuto 2',
    'studio.hint3': 'Aiuto 3',
    'studio.hint1Placeholder': 'Primo aiuto',
    'studio.hint2Placeholder': 'Secondo aiuto',
    'studio.hint3Placeholder': 'Terzo aiuto',
    'studio.stationEmptyHint':
      'Tocca qui per modificare storia, indovinello e aiuti.',
    'studio.points': 'punti',
    'studio.checkRoute': 'Controlla percorso',
    'studio.checkRouteCopy':
      'Controlla ordine, distanza e passaggi tra le stazioni.',
    'studio.edit': 'Modifica',
    'studio.close': 'Chiudi',
    'studio.cancel': 'Annulla',
    'studio.save': 'Salva',
    'workflow.plan': 'Piano',
    'workflow.story': 'Storia',
    'workflow.stations': 'Stazioni',
    'workflow.route': 'Percorso',
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
