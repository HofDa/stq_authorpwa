import {
  DEFAULT_LOCALE,
  hasAcceptedAnswer,
  type Locale,
  type RiddleEntry,
} from '@/schema';
import { presenceCheck, type LocalCheck } from './readinessTypes';

/**
 * Returns the per-station local checks. The active locale is what's checked
 * for textual content; GPS and photo are global to the station.
 */
export function getStationReadiness(
  station: RiddleEntry,
  locale: Locale = DEFAULT_LOCALE,
): LocalCheck[] {
  const localized = station[locale];
  const target = (field: string) => ({
    section: 'stations' as const,
    stationId: station.id,
    field,
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

  return [
    presenceCheck({
      id: `${station.id}.title`,
      label: 'Station name',
      present: Boolean(localized.location.trim()),
      missingMessage: 'Give this station a recognisable name.',
      target: target('location'),
    }),
    presenceCheck({
      id: `${station.id}.gps`,
      label: 'GPS coordinates',
      present: station.position_lat !== 0 || station.position_lng !== 0,
      missingMessage: 'Drop or capture a pin for this station.',
      severity: 'error',
      target: target('gps'),
    }),
    presenceCheck({
      id: `${station.id}.photo`,
      label: 'Station photo',
      present: Boolean(station.imageBlobId || station.imagePath),
      missingMessage:
        'A photo helps players recognise the spot on arrival.',
      severity: 'info',
      target: target('photo'),
    }),
    presenceCheck({
      id: `${station.id}.story`,
      label: 'Story blocks',
      present:
        localized.firstSection.length + localized.historySection.length > 0,
      missingMessage:
        'Add at least one story block so players know what they are looking at.',
      target: target('story'),
    }),
    {
      id: `${station.id}.riddle`,
      label: 'Riddle & answer',
      status: riddleStatus,
      severity: riddleStatus === 'problem' ? 'error' : 'warning',
      message: riddleMessage,
      target: target('riddle'),
    },
    presenceCheck({
      id: `${station.id}.success`,
      label: 'Success message',
      present: localized.successSection.length > 0,
      missingMessage:
        'Tell players what they unlocked when they solve it.',
      target: target('success'),
    }),
  ];
}
