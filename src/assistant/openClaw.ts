import type {
  ContentBlock,
  Locale,
  RiddleEntry,
  TourDraft,
  TourLocaleContent,
} from '@/schema';

export type AssistantFocus =
  | 'narrative'
  | 'riddle'
  | 'translation'
  | 'field-check';

export interface AssistantScope {
  draft: TourDraft;
  locale: Locale;
  kind: 'tour' | 'station';
  station?: RiddleEntry;
}

export interface LocalAssistantCheck {
  level: 'warning' | 'info' | 'ready';
  title: string;
  detail: string;
}

const FOCUS_LABELS: Record<AssistantFocus, string> = {
  narrative: 'Narrative',
  riddle: 'Riddle',
  translation: 'Translation',
  'field-check': 'Field Check',
};

export const ASSISTANT_FOCUS_OPTIONS = (
  Object.keys(FOCUS_LABELS) as AssistantFocus[]
).map((value) => ({
  value,
  label: FOCUS_LABELS[value],
}));

export function buildOpenClawPrompt(
  scope: AssistantScope,
  focus: AssistantFocus,
  question: string,
): string {
  const title = scope.draft.tour[scope.locale].title || scope.draft.tour.id;
  const lines = [
    'You are OpenClaw, acting as a field authoring assistant for SouthTyrolQuests.',
    'The author is editing a mobile-first tour-creation PWA that should feel like the real tourist app, but with extra authoring controls.',
    `Current locale: ${scope.locale.toUpperCase()}.`,
    `Focus area: ${FOCUS_LABELS[focus]}.`,
    `Tour title: ${title}.`,
    `Tour id: ${scope.draft.tour.id}.`,
    `Station count: ${scope.draft.stations.length}.`,
  ];

  if (scope.kind === 'station' && scope.station) {
    lines.push(`Station number: ${scope.station.number}.`);
    lines.push(
      `Station title: ${scope.station[scope.locale].location || scope.station.id}.`,
    );
    lines.push(
      `Station coordinates: ${scope.station.position_lat}, ${scope.station.position_lng}.`,
    );
  }

  lines.push('');
  lines.push('Author request:');
  lines.push(question.trim() || defaultQuestionForFocus(scope.kind, focus));
  lines.push('');
  lines.push('Current draft snapshot:');
  lines.push(buildContextSnapshot(scope));
  lines.push('');
  lines.push('Please answer with concrete, mobile-first authoring guidance.');

  return lines.join('\n');
}

export function buildContextSnapshot(scope: AssistantScope): string {
  const tour = scope.draft.tour;
  const activeTour = tour[scope.locale];
  const base = {
    kind: scope.kind,
    locale: scope.locale,
    tour: {
      id: tour.id,
      number: tour.number,
      title: activeTour.title,
      location: activeTour.location,
      distance: tour.distance,
      duration: activeTour.duration,
      unlocked: tour.unlocked,
      hideUnsolvedRiddles: tour.hideUnsolvedRiddles ?? false,
      gpsRangeMeters: tour.gpsRangeMeters ?? null,
      stationCount: scope.draft.stations.length,
      introPreview: summarizeBlocks(activeTour.introSection, 3),
      descriptionPreview: summarizeBlocks(activeTour.description, 2),
      outroPreview: summarizeBlocks(activeTour.outroSection, 2),
    },
  };

  if (scope.kind !== 'station' || !scope.station) {
    return JSON.stringify(base, null, 2);
  }

  const station = scope.station;
  const content = station[scope.locale];
  return JSON.stringify(
    {
      ...base,
      station: {
        id: station.id,
        number: station.number,
        title: content.location,
        riddleType: station.riddleType,
        solution: station.solution ?? '',
        hintCount: content.hints.length,
        position: {
          lat: station.position_lat,
          lng: station.position_lng,
        },
        firstSectionPreview: summarizeBlocks(content.firstSection, 3),
        historySectionPreview: summarizeBlocks(content.historySection, 2),
        riddleSectionPreview: summarizeBlocks(content.riddleSection, 3),
        successSectionPreview: summarizeBlocks(content.successSection, 2),
      },
    },
    null,
    2,
  );
}

export function runLocalAssistantChecks(
  scope: AssistantScope,
): LocalAssistantCheck[] {
  const checks =
    scope.kind === 'station' && scope.station
      ? buildStationChecks(scope)
      : buildTourChecks(scope);

  return checks.length > 0
    ? checks
    : [
        {
          level: 'ready',
          title: 'Good baseline',
          detail: 'This draft has enough structure for OpenClaw to give targeted advice.',
        },
      ];
}

export function defaultQuestionForFocus(
  kind: AssistantScope['kind'],
  focus: AssistantFocus,
): string {
  if (kind === 'station') {
    switch (focus) {
      case 'narrative':
        return 'Improve this station so the story reads clearly on a phone while standing outdoors.';
      case 'riddle':
        return 'Tighten this riddle so it is fair, grounded in the place, and solvable in the field.';
      case 'translation':
        return 'Flag wording that may be hard to translate cleanly into German and Italian.';
      case 'field-check':
        return 'Review this station for outdoor authoring risks such as weak clues, poor flow, or GPS ambiguity.';
    }
  }

  switch (focus) {
    case 'narrative':
      return 'Review the tour arc and suggest how to make the overall experience feel cohesive on mobile.';
    case 'riddle':
      return 'Review the tour sequence and suggest where station difficulty or payoff should be adjusted.';
    case 'translation':
      return 'Check the tour structure for translation-sensitive wording and uneven localization coverage.';
    case 'field-check':
      return 'Review this tour for field-authoring gaps before it is walked and tested on-site.';
  }
}

function buildTourChecks(scope: AssistantScope): LocalAssistantCheck[] {
  const checks: LocalAssistantCheck[] = [];
  const tour = scope.draft.tour;
  const activeTour = tour[scope.locale];
  const missingLocaleFields = missingTourLocaleFields(activeTour);
  const stationsWithoutGps = scope.draft.stations.filter(isZeroCoordinate);

  if (!tour.coverBlobId && !tour.imagePath) {
    checks.push({
      level: 'warning',
      title: 'Missing cover image',
      detail: 'The tour card has no local cover photo yet, so the tourist-facing first impression is weak.',
    });
  }

  if (missingLocaleFields.length > 0) {
    checks.push({
      level: 'warning',
      title: 'Current locale is incomplete',
      detail: `Missing in ${scope.locale.toUpperCase()}: ${missingLocaleFields.join(', ')}.`,
    });
  }

  if (scope.draft.stations.length < 3) {
    checks.push({
      level: 'info',
      title: 'Tour still short',
      detail: 'The draft has fewer than 3 stations, so OpenClaw feedback will be more tactical than flow-oriented.',
    });
  }

  if (stationsWithoutGps.length > 0) {
    checks.push({
      level: 'warning',
      title: 'Stations missing live coordinates',
      detail: `${stationsWithoutGps.length} station(s) still use 0,0 coordinates and should be captured on-site.`,
    });
  }

  if (activeTour.introSection.length === 0 || activeTour.outroSection.length === 0) {
    checks.push({
      level: 'info',
      title: 'Tour framing is thin',
      detail: 'Adding both intro and outro content gives the authoring assistant better narrative context.',
    });
  }

  return checks;
}

function buildStationChecks(scope: AssistantScope): LocalAssistantCheck[] {
  const checks: LocalAssistantCheck[] = [];
  const station = scope.station!;
  const active = station[scope.locale];
  const missingLocaleFields = missingStationLocaleFields(active);

  if (isZeroCoordinate(station)) {
    checks.push({
      level: 'warning',
      title: 'Missing field GPS',
      detail: 'This station still uses 0,0 coordinates and should be captured at the real location.',
    });
  }

  if (!station.imageBlobId && !station.imagePath) {
    checks.push({
      level: 'warning',
      title: 'No station photo yet',
      detail: 'The preview is less trustworthy without an on-site image for this stop.',
    });
  }

  if (!station.solution?.trim()) {
    checks.push({
      level: 'warning',
      title: 'Missing answer',
      detail: 'OpenClaw can critique the riddle better once the intended solution is explicit.',
    });
  }

  if (missingLocaleFields.length > 0) {
    checks.push({
      level: 'warning',
      title: 'Current locale is incomplete',
      detail: `Missing in ${scope.locale.toUpperCase()}: ${missingLocaleFields.join(', ')}.`,
    });
  }

  if (active.hints.length === 0) {
    checks.push({
      level: 'info',
      title: 'Hints not drafted',
      detail: 'Adding at least one hint helps the assistant evaluate difficulty and fairness.',
    });
  }

  if (!station.iconPath || !station.markerIconPath) {
    checks.push({
      level: 'info',
      title: 'Map assets still blank',
      detail: 'Icon and marker paths are still empty, so place identity on the map is not represented yet.',
    });
  }

  return checks;
}

function missingTourLocaleFields(locale: TourLocaleContent): string[] {
  const missing: string[] = [];
  if (!locale.title.trim()) missing.push('title');
  if (!locale.location.trim()) missing.push('location');
  if (!locale.duration.trim()) missing.push('duration');
  if (locale.description.length === 0) missing.push('description');
  if (locale.introSection.length === 0) missing.push('intro');
  if (locale.outroSection.length === 0) missing.push('outro');
  return missing;
}

function missingStationLocaleFields(station: RiddleEntry[Locale]): string[] {
  const missing: string[] = [];
  if (!station.location.trim()) missing.push('location');
  if (station.firstSection.length === 0) missing.push('story');
  if (station.historySection.length === 0) missing.push('history');
  if (station.riddleSection.length === 0) missing.push('riddle');
  if (station.successSection.length === 0) missing.push('success');
  return missing;
}

function summarizeBlocks(blocks: ContentBlock[], maxItems: number): string[] {
  return blocks
    .slice(0, maxItems)
    .map((block) => {
      if (block.type === 'image') {
        return `[image:${block.imagePath || 'pending'}]`;
      }
      return block.text.trim();
    })
    .filter(Boolean);
}

function isZeroCoordinate(station: RiddleEntry): boolean {
  return station.position_lat === 0 && station.position_lng === 0;
}
