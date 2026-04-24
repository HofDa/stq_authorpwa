import type {
  ContentBlock,
  RiddleEntry,
  RiddleLocaleContent,
  TourDraft,
  TourEntry,
  TourLocaleContent,
} from '@/schema';

function tourLocale(title: string): TourLocaleContent {
  return {
    title,
    location: 'Bolzano',
    duration: '2h',
    description: [{ type: 'paragraph', text: `${title} description` }],
    introSection: [{ type: 'heading', text: `${title} intro` }],
    outroSection: [{ type: 'paragraph', text: `${title} outro` }],
  };
}

function riddleLocale(hint: string): RiddleLocaleContent {
  return {
    location: 'Piazza Walther',
    firstSection: [{ type: 'paragraph', text: `${hint} first` }],
    historySection: [
      { type: 'heading', text: 'History' },
      { type: 'paragraph', text: 'Built in 1295.' },
      { type: 'image', imagePath: '', localBlobId: 'blob-station-body' },
    ],
    riddleSection: [{ type: 'paragraph', text: 'Solve me' }],
    successSection: [{ type: 'paragraph', text: 'Well done' }],
    hints: ['Look up', 'Count the windows'],
    solution: 'tower',
  };
}

export function buildValidTour(id = 'bolzano-classic'): TourEntry {
  return {
    id,
    number: 1,
    imagePath: '',
    coverBlobId: 'blob-cover',
    riddlesPath: `${id}/riddles.json`,
    distance: '3.2 km',
    unlocked: true,
    gpsRangeMeters: 20,
    en: tourLocale('Bolzano Classic'),
    de: tourLocale('Bozen Klassisch'),
    it: tourLocale('Bolzano Classico'),
  };
}

export function buildValidStation(
  id = 'station-1',
  number = 1,
): RiddleEntry {
  return {
    id,
    number,
    position_lat: 46.4983,
    position_lng: 11.3548,
    polylineString: '',
    imagePath: '',
    imageBlobId: 'blob-station-hero',
    iconPath: '',
    markerIconPath: '',
    riddleType: 'text',
    solutionInputType: 'text',
    solution: 'tower',
    en: riddleLocale('en'),
    de: riddleLocale('de'),
    it: riddleLocale('it'),
  };
}

export function buildValidDraft(): TourDraft {
  return {
    draftId: 'bolzano-classic',
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    tour: buildValidTour(),
    stations: [buildValidStation('station-1', 1)],
    recordedRoute: [],
  };
}

export function blockCount(blocks: ContentBlock[]): number {
  return blocks.length;
}
