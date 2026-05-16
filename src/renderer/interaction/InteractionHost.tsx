import type { RrrInteraction, RrrModule } from '@/rrr/types';
import { CodeEntryPlayer } from './CodeEntryPlayer';
import { CompassPlayer } from './CompassPlayer';
import { DirectionHotColdPlayer } from './DirectionHotColdPlayer';
import { MorseCodePlayer } from './MorseCodePlayer';
import { ProximityRadarPlayer } from './ProximityRadarPlayer';
import { QrScanPlayer } from './QrScanPlayer';
import { TextAnswerPlayer } from './TextAnswerPlayer';

export interface InteractionHostLabels {
  submit: string;
  compassEnable: string;
  compassStarting: string;
  compassUnavailable: string;
  compassDenied: string;
  compassAligned: string;
  compassAlign: string;
}

interface InteractionHostProps {
  interaction?: RrrInteraction;
  acceptedAnswers: string[];
  labels: InteractionHostLabels;
  onCorrect: () => void;
  disabled?: boolean;
}

export function InteractionHost({
  interaction,
  acceptedAnswers,
  labels,
  onCorrect,
  disabled = false,
}: InteractionHostProps) {
  const activeModule = pickActiveModule(interaction);

  if (!activeModule) {
    return (
      <TextAnswerPlayer
        acceptedAnswers={acceptedAnswers}
        submitLabel={labels.submit}
        onCorrect={onCorrect}
        disabled={disabled}
      />
    );
  }

  switch (activeModule.type) {
    case 'text_answer':
      return (
        <TextAnswerPlayer
          acceptedAnswers={readAcceptedAnswers(activeModule, acceptedAnswers)}
          submitLabel={labels.submit}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'code_word':
    case 'sequential_code':
      return (
        <CodeEntryPlayer
          expectedCode={readString(activeModule.config.code)}
          fallbackAnswers={acceptedAnswers}
          caseSensitive={Boolean(activeModule.config.caseSensitive)}
          variant={activeModule.type}
          submitLabel={labels.submit}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'compass_align': {
      const targetDegrees = readNumber(activeModule.config.targetDegrees);
      const tolerance = Math.max(2, readNumber(activeModule.config.tolerance) || 15);
      return (
        <CompassPlayer
          targetDegrees={targetDegrees}
          tolerance={tolerance}
          enableLabel={labels.compassEnable}
          startingLabel={labels.compassStarting}
          unavailableLabel={labels.compassUnavailable}
          deniedLabel={labels.compassDenied}
          alignedLabel={labels.compassAligned}
          alignLabel={labels.compassAlign}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    }
    case 'direction_hotcold': {
      const targetDegrees = readNumber(activeModule.config.targetDegrees);
      const successTolerance = Math.max(
        2,
        readNumber(activeModule.config.successTolerance) || 15,
      );
      return (
        <DirectionHotColdPlayer
          targetDegrees={targetDegrees}
          successTolerance={successTolerance}
          enableLabel={labels.compassEnable}
          startingLabel={labels.compassStarting}
          unavailableLabel={labels.compassUnavailable}
          deniedLabel={labels.compassDenied}
          alignedLabel={labels.compassAligned}
          alignLabel={labels.compassAlign}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    }
    case 'qr_scan': {
      const expectedValue = readString(activeModule.config.expectedValue);
      return (
        <QrScanPlayer
          expectedValue={expectedValue}
          fallbackAnswers={acceptedAnswers}
          submitLabel={labels.submit}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    }
    case 'morse_code':
      return (
        <MorseCodePlayer
          expectedPattern={readString(activeModule.config.pattern)}
          shortAudioUrl={readString(activeModule.config.shortAudioUrl)}
          longAudioUrl={readString(activeModule.config.longAudioUrl)}
          submitLabel={labels.submit}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'proximity_hint':
      return (
        <ProximityRadarPlayer
          targetLat={readNumber(activeModule.config.lat)}
          targetLng={readNumber(activeModule.config.lng)}
          successRadiusMeters={Math.max(
            1,
            readNumber(activeModule.config.successRadiusMeters) || 20,
          )}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    default:
      return (
        <TextAnswerPlayer
          acceptedAnswers={acceptedAnswers}
          submitLabel={labels.submit}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
  }
}

function pickActiveModule(
  interaction: RrrInteraction | undefined,
): RrrModule | undefined {
  if (!interaction) return undefined;
  return interaction.modules[0];
}

function readAcceptedAnswers(
  module: RrrModule,
  fallback: string[],
): string[] {
  const raw = module.config.acceptedAnswers;
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string');
  }
  return fallback;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return 0;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
