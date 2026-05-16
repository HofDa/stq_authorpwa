import {
  getConditionChildren,
  readRrrNumber as readNumber,
  readRrrNumberArray as readNumberArray,
  readRrrString as readString,
  readRrrStringArray as readStringArray,
  readRrrTextAnswers,
} from '@/rrr';
import type { RrrCondition, RrrInteraction, RrrModule } from '@/rrr/types';
import { BalanceRunPlayer } from './BalanceRunPlayer';
import { CodeEntryPlayer } from './CodeEntryPlayer';
import { CompassPlayer } from './CompassPlayer';
import { ConfirmationPlayer } from './ConfirmationPlayer';
import { DirectionHotColdPlayer } from './DirectionHotColdPlayer';
import { HoldStillPlayer } from './HoldStillPlayer';
import { MorseCodePlayer } from './MorseCodePlayer';
import { MultiChoicePlayer } from './MultiChoicePlayer';
import { ProximityRadarPlayer } from './ProximityRadarPlayer';
import { QrScanPlayer } from './QrScanPlayer';
import { SafeDialPlayer } from './SafeDialPlayer';
import { TextAnswerPlayer } from './TextAnswerPlayer';
import { TimerWaitPlayer } from './TimerWaitPlayer';

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
    case 'multi_choice':
      return (
        <MultiChoicePlayer
          question={readString(activeModule.config.question)}
          options={readStringArray(activeModule.config.options)}
          correctOptionIndexes={readNumberArray(
            activeModule.config.correctOptionIndexes,
          )}
          allowMultiple={Boolean(activeModule.config.allowMultiple)}
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
    case 'safe_dial': {
      const targetDegrees = readNumber(activeModule.config.targetDegrees);
      const tolerance = Math.max(2, readNumber(activeModule.config.tolerance) || 12);
      const holdMs = Math.max(0, readNumber(activeModule.config.holdMs) || 900);
      return (
        <SafeDialPlayer
          targetDegrees={targetDegrees}
          tolerance={tolerance}
          holdMs={holdMs}
          enableLabel={labels.compassEnable}
          startingLabel={labels.compassStarting}
          unavailableLabel={labels.compassUnavailable}
          deniedLabel={labels.compassDenied}
          unlockedLabel="Tresor entriegelt"
          alignLabel={labels.compassAlign}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    }
    case 'hold_still':
      return (
        <HoldStillPlayer
          durationMs={Math.max(
            500,
            readNumber(activeModule.config.durationMs) || 3000,
          )}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'gps_enter':
      return (
        <ProximityRadarPlayer
          targetLat={readNumber(activeModule.config.lat)}
          targetLng={readNumber(activeModule.config.lng)}
          successRadiusMeters={Math.max(
            1,
            readNumber(activeModule.config.radiusMeters) || 20,
          )}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
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
    case 'balance_run':
      return (
        <BalanceRunPlayer
          startLat={readNumber(activeModule.config.startLat)}
          startLng={readNumber(activeModule.config.startLng)}
          targetLat={readNumber(activeModule.config.targetLat)}
          targetLng={readNumber(activeModule.config.targetLng)}
          successRadiusMeters={Math.max(
            1,
            readNumber(activeModule.config.successRadiusMeters) || 20,
          )}
          timeLimitMs={Math.max(
            1000,
            readNumber(activeModule.config.timeLimitMs) || 60000,
          )}
          maxTiltDegrees={Math.max(
            1,
            readNumber(activeModule.config.maxTiltDegrees) || 12,
          )}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'timer_wait':
      return (
        <TimerWaitPlayer
          durationMs={Math.max(
            1000,
            readNumber(activeModule.config.durationMs) || 3000,
          )}
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'photo_check_manual':
      return (
        <ConfirmationPlayer
          eyebrow="Foto-Aufgabe"
          prompt={readString(activeModule.config.prompt)}
          fallbackPrompt="Foto-Aufgabe bestätigen"
          confirmLabel={
            readString(activeModule.config.confirmLabel).trim() || 'Bestätigt'
          }
          onCorrect={onCorrect}
          disabled={disabled}
        />
      );
    case 'object_found':
      return (
        <ConfirmationPlayer
          eyebrow="Objekt gefunden"
          prompt={readString(activeModule.config.prompt)}
          fallbackPrompt="Fund bestätigen"
          confirmLabel={
            readString(activeModule.config.confirmLabel).trim() || 'Gefunden'
          }
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
  const conditionModuleId = interaction.condition
    ? firstConditionModuleId(interaction.condition)
    : undefined;
  return (
    interaction.modules.find((module) => module.id === conditionModuleId) ??
    interaction.modules[0]
  );
}

function firstConditionModuleId(condition: RrrCondition): string | undefined {
  if (condition.type === 'module') {
    return condition.moduleId;
  }

  for (const child of getConditionChildren(condition)) {
    const moduleId = firstConditionModuleId(child);
    if (moduleId) return moduleId;
  }
  return undefined;
}

function readAcceptedAnswers(
  module: RrrModule,
  fallback: string[],
): string[] {
  return readRrrTextAnswers(module, fallback);
}
