import {
  DEFAULT_LOCALE,
  hasAcceptedAnswer,
  type Locale,
  type RiddleEntry,
} from '@/schema';
import type { LocalCheck } from './readinessTypes';

/**
 * Returns the per-station local checks. The active locale is what's checked
 * for textual content; GPS and photo are global to the station.
 */
export function getStationReadiness(
  station: RiddleEntry,
  locale: Locale = DEFAULT_LOCALE,
): LocalCheck[] {
  const localized = station[locale];
  const checks: LocalCheck[] = [];

  checks.push({
    id: `${station.id}.title`,
    label: 'Station name',
    status: localized.location.trim() ? 'ready' : 'missing',
    severity: 'warning',
    message: localized.location.trim()
      ? undefined
      : 'Give this station a recognisable name.',
    target: { section: 'stations', stationId: station.id, field: 'location' },
  });

  const hasGps = station.position_lat !== 0 || station.position_lng !== 0;
  checks.push({
    id: `${station.id}.gps`,
    label: 'GPS coordinates',
    status: hasGps ? 'ready' : 'missing',
    severity: 'error',
    message: hasGps ? undefined : 'Drop or capture a pin for this station.',
    target: { section: 'stations', stationId: station.id, field: 'gps' },
  });

  const hasPhoto = Boolean(station.imageBlobId || station.imagePath);
  checks.push({
    id: `${station.id}.photo`,
    label: 'Station photo',
    status: hasPhoto ? 'ready' : 'missing',
    severity: 'info',
    message: hasPhoto
      ? undefined
      : 'A photo helps players recognise the spot on arrival.',
    target: { section: 'stations', stationId: station.id, field: 'photo' },
  });

  const storyBlocks =
    localized.firstSection.length + localized.historySection.length;
  checks.push({
    id: `${station.id}.story`,
    label: 'Story blocks',
    status: storyBlocks > 0 ? 'ready' : 'missing',
    severity: 'warning',
    message:
      storyBlocks > 0
        ? undefined
        : 'Add at least one story block so players know what they are looking at.',
    target: { section: 'stations', stationId: station.id, field: 'story' },
  });

  const hasRiddleText = localized.riddleSection.length > 0;
  const hasAnswer = hasAcceptedAnswer(station.acceptedAnswers, locale);
  let riddleStatus: LocalCheck['status'];
  let riddleMessage: string | undefined;
  if (hasRiddleText && hasAnswer) {
    riddleStatus = 'ready';
  } else if (!hasRiddleText && !hasAnswer) {
    riddleStatus = 'missing';
    riddleMessage = 'Write the riddle and add at least one accepted answer.';
  } else if (!hasAnswer) {
    riddleStatus = 'problem';
    riddleMessage = 'Riddle has no accepted answer yet.';
  } else {
    riddleStatus = 'draft';
    riddleMessage = 'Answer is set but the riddle text is empty.';
  }
  checks.push({
    id: `${station.id}.riddle`,
    label: 'Riddle & answer',
    status: riddleStatus,
    severity: riddleStatus === 'problem' ? 'error' : 'warning',
    message: riddleMessage,
    target: { section: 'stations', stationId: station.id, field: 'riddle' },
  });

  checks.push({
    id: `${station.id}.success`,
    label: 'Success message',
    status:
      localized.successSection.length > 0 ? 'ready' : 'missing',
    severity: 'warning',
    message:
      localized.successSection.length > 0
        ? undefined
        : 'Tell players what they unlocked when they solve it.',
    target: { section: 'stations', stationId: station.id, field: 'success' },
  });

  return checks;
}
