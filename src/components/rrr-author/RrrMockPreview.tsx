import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  createRrrFieldTestReport,
  downloadRrrFieldTestReport,
  getConditionChildren,
  getRrrWarnings,
  type RrrCondition,
  type RrrInteraction,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';
import { moduleFeedbackKindFromStatus } from '@/components/rrr-runtime/moduleFeedbackTypes';
import type { RrrFieldTestIssueTag } from '@/schema';
import {
  evaluateMockInteraction,
  type RrrMockInputs,
  type RrrMockStatus,
} from '@/rrr/preview';
import {
  createRrrRuntimeSession,
  evaluateInteraction,
  reduceRrrRuntimeSession,
  type RrrInteractionResult,
  type RrrRuntimeSession,
} from '@/rrr/runtime';
import { RrrConditionStatusTree } from './RrrConditionStatusTree';
import { CodeEntryControl } from './CodeEntryControl';
import { CompassControl } from './CompassControl';
import { DirectionHotColdControl } from './DirectionHotColdControl';
import { MorseCodeControl } from './MorseCodeControl';
import { ProximityRadarControl } from './ProximityRadarControl';
import { TextAnswerControl } from './TextAnswerControl';

const QrScanner = lazy(() =>
  import('@/components/rrr-runtime/QrScanner').then((module) => ({
    default: module.QrScanner,
  })),
);

const INITIAL_INPUTS: RrrMockInputs = {
  headingDegrees: 0,
  gpsLat: 0,
  gpsLng: 0,
  isStill: false,
  textAnswer: '',
  qrScanValue: '',
  morseCodeValue: '',
  codeWordValue: '',
  sequentialCodeValue: '',
  multiChoiceSelectionsByModuleId: {},
  photoCheckManualModuleIds: [],
  objectFoundModuleIds: [],
};

export function RrrMockPreview({
  interaction,
  expertMode = false,
  stationId = 'unassigned-station',
  stationTitle = 'Unbenannte Station',
  fieldTestIssueTags = [],
}: {
  interaction: RrrInteraction;
  expertMode?: boolean;
  stationId?: string;
  stationTitle?: string;
  fieldTestIssueTags?: RrrFieldTestIssueTag[];
}) {
  const [inputs, setInputs] = useState<RrrMockInputs>(INITIAL_INPUTS);
  const [session, dispatchSession] = useReducer(
    reduceRrrRuntimeSession,
    undefined,
    createRrrRuntimeSession,
  );
  const sessionRef = useRef(session);
  const [autoEvaluate, setAutoEvaluate] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const inputState = useMemo(
    () => ({
      headingDegrees: inputs.headingDegrees,
      gpsLat: inputs.gpsLat,
      gpsLng: inputs.gpsLng,
      isStill: inputs.isStill,
    }),
    [inputs.gpsLat, inputs.gpsLng, inputs.headingDegrees, inputs.isStill],
  );
  const userInput = useMemo(
    () => ({
      textAnswer: inputs.textAnswer,
      qrScanValue: inputs.qrScanValue,
      morseCodeValue: inputs.morseCodeValue,
      codeWordValue: inputs.codeWordValue,
      sequentialCodeValue: inputs.sequentialCodeValue,
      multiChoiceSelectionsByModuleId: inputs.multiChoiceSelectionsByModuleId,
      photoCheckManualModuleIds: inputs.photoCheckManualModuleIds,
      objectFoundModuleIds: inputs.objectFoundModuleIds,
    }),
    [
      inputs.codeWordValue,
      inputs.multiChoiceSelectionsByModuleId,
      inputs.objectFoundModuleIds,
      inputs.photoCheckManualModuleIds,
      inputs.qrScanValue,
      inputs.morseCodeValue,
      inputs.sequentialCodeValue,
      inputs.textAnswer,
    ],
  );
  const evaluation = useMemo(
    () => evaluateMockInteraction(interaction, inputs),
    [interaction, inputs],
  );
  const sessionEvaluation = useMemo(
    () =>
      evaluateInteraction(interaction, inputState, userInput, session, {
        nowMs: Date.now(),
      }),
    [interaction, inputState, userInput, session],
  );
  const activeStep = useMemo(
    () => getGuidedStep(interaction, sessionEvaluation, session),
    [interaction, sessionEvaluation, session],
  );
  const stepIndex = activeStep?.index ?? 0;
  const stepCount = activeStep?.total ?? interaction.modules.length;
  const activeResult = activeStep
    ? sessionEvaluation.modules[activeStep.module.id]
    : undefined;

  function patchInputs(patch: Partial<RrrMockInputs>) {
    setInputs((current) => ({
      ...current,
      ...patch,
    }));
  }

  function handleStart() {
    const freshSession = createRrrRuntimeSession();
    const nowMs = Date.now();
    const firstEvaluation = evaluateInteraction(
      interaction,
      inputState,
      userInput,
      freshSession,
      { nowMs },
    );
    dispatchSession({ type: 'reset' });
    dispatchSession({ type: 'evaluation', result: firstEvaluation, nowMs });
  }

  function handleReset() {
    dispatchSession({ type: 'reset' });
    setInputs(INITIAL_INPUTS);
  }

  function handleRetry() {
    dispatchSession({
      type: 'retry',
      moduleId: activeStep?.module.id,
      resetProgress: activeStep?.module.retry?.resetOnFail,
    });
  }

  function handleStep() {
    const nowMs = Date.now();
    dispatchSession({
      type: 'evaluation',
      result: evaluateInteraction(interaction, inputState, userInput, session, {
        nowMs,
      }),
      nowMs,
    });
  }

  function handleExportReport() {
    downloadRrrFieldTestReport(
      createRrrFieldTestReport({
        station: {
          id: stationId,
          title: stationTitle,
        },
        interaction,
        finalResult: sessionEvaluation.status,
        result: sessionEvaluation,
        notes: reportNotes,
        issueTags: fieldTestIssueTags,
        warnings: getRrrWarnings(interaction),
      }),
    );
  }

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!autoEvaluate) return;
    const currentSession = sessionRef.current;
    if (
      currentSession.status === 'idle' ||
      currentSession.status === 'success' ||
      currentSession.status === 'failed'
    ) {
      return;
    }
    const nowMs = Date.now();
    dispatchSession({
      type: 'evaluation',
      result: evaluateInteraction(
        interaction,
        inputState,
        userInput,
        currentSession,
        { nowMs },
      ),
      nowMs,
    });
  }, [autoEvaluate, inputState, interaction, userInput]);

  const canCheck =
    session.status !== 'idle' &&
    session.status !== 'success' &&
    session.status !== 'failed';

  return (
    <section className="stq-rrr-mock" aria-label="Testvorschau">
      <div className="stq-rrr-mock__header">
        <div>
          <strong>Geführter Test</strong>
          <span>Nur manuelle Werte. Es werden keine Gerätesensoren verwendet.</span>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="stq-rrr-guide">
        <div className="stq-rrr-guide__step">
          <span>Aktueller Schritt</span>
          <strong>
            {activeStep
              ? `Schritt ${stepIndex + 1} von ${Math.max(stepCount, 1)}`
              : 'Kein Schritt verfügbar'}
          </strong>
          <small>
            {activeStep
              ? activeStep.module.label
              : 'Füge Bausteine und eine Lösungsregel hinzu, um den Test zu starten.'}
          </small>
        </div>

        {activeStep ? (
          <>
            <p className="stq-rrr-guide__instruction">
              {getPlayerInstruction(activeStep.module)}
            </p>
            <FallbackGuidance
              module={activeStep.module}
              modules={interaction.modules}
              results={sessionEvaluation.modules}
            />
            <GuidedControl
              module={activeStep.module}
              inputs={inputs}
              onPatchInputs={patchInputs}
            />
            <ModuleFeedback
              kind={moduleFeedbackKindFromStatus(
                activeResult?.status ?? 'running',
              )}
              eyebrow="Rückmeldung"
              message={activeResult?.message ?? 'Warte auf Eingabe'}
            />
          </>
        ) : (
          <div className="stq-rrr-editor__empty">
            Füge Bausteine hinzu und wähle eine Lösungsregel, um den geführten
            Test zu verwenden.
          </div>
        )}
      </div>

      <div className="stq-rrr-mock__session-controls">
        <button
          type="button"
          onClick={handleStart}
          disabled={session.status !== 'idle'}
        >
          Test starten
        </button>
        <button type="button" onClick={handleReset}>
          Test zurücksetzen
        </button>
        <button type="button" onClick={handleStep} disabled={!canCheck}>
          Schritt prüfen
        </button>
        <label className="stq-rrr-check">
          <input
            type="checkbox"
            checked={autoEvaluate}
            onChange={(event) => setAutoEvaluate(event.target.checked)}
          />
          <span>Automatisch prüfen</span>
        </label>
      </div>

      {session.status === 'success' && (
        <ModuleFeedback
          kind="success"
          eyebrow="Testergebnis"
          message="Das Rätsel wurde erfolgreich gelöst."
        />
      )}

      {session.status === 'failed' && (
        <ModuleFeedback
          kind="error"
          eyebrow="Testergebnis"
          message={
            activeResult?.timeout?.retryable
              ? 'Zeit abgelaufen. Du kannst es noch einmal versuchen.'
              : 'Dieser Testlauf ist fehlgeschlagen. Setze ihn zurück.'
          }
          action={
            activeResult?.timeout?.retryable ? (
            <button
              type="button"
              className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
              onClick={handleRetry}
            >
              Noch einmal versuchen
            </button>
            ) : undefined
          }
        />
      )}

      <div className="stq-rrr-report-export">
        <label className="stq-rrr-field">
          <span>Notizen für Testbericht</span>
          <textarea
            value={reportNotes}
            onChange={(event) => setReportNotes(event.target.value)}
            placeholder="Optional: Beobachtungen aus dem Testlauf"
          />
        </label>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={handleExportReport}
        >
          Testbericht exportieren
        </button>
      </div>

      {expertMode && (
        <details className="stq-rrr-mock__expert" open>
          <summary>Expertendetails</summary>
          <div className="stq-rrr-mock__result">
            <div className="stq-rrr-mock__condition">
              <span>Lösungsregel</span>
              <strong>{evaluation.condition.message}</strong>
              <StatusBadge status={evaluation.condition.status} />
            </div>

            <RrrConditionStatusTree
              condition={interaction.condition}
              modules={evaluation.modules}
            />

            {Object.keys(evaluation.modules).length === 0 ? (
              <div className="stq-rrr-editor__empty">
                Füge Bausteine hinzu, um ihren Teststatus zu sehen.
              </div>
            ) : (
              <div className="stq-rrr-mock__modules">
                {Object.values(evaluation.modules).map((module) => (
                  <div key={module.id} className="stq-rrr-mock__module">
                    <div>
                      <strong>{module.label}</strong>
                      <span>
                        {getModuleTypeLabel(module.type)} · {module.id}
                      </span>
                      <small>{module.message}</small>
                    </div>
                    <StatusBadge status={module.status} />
                  </div>
                ))}
              </div>
            )}

            <dl className="stq-rrr-mock__session-stats">
              <div>
                <dt>Status</dt>
                <dd>{session.status}</dd>
              </div>
              <div>
                <dt>Aktiver Schritt</dt>
                <dd>{session.activeSequenceIndex}</dd>
              </div>
              <div>
                <dt>Erfüllte Bausteine</dt>
                <dd>
                  {session.completedModuleIds.length === 0
                    ? '-'
                    : session.completedModuleIds.join(', ')}
                </dd>
              </div>
            </dl>

            {Object.keys(sessionEvaluation.modules).length > 0 && (
              <div className="stq-rrr-mock__modules">
                {Object.values(sessionEvaluation.modules).map((module) => (
                  <div key={module.id} className="stq-rrr-mock__module">
                    <div>
                      <strong>{module.label}</strong>
                      <span>
                        {getModuleTypeLabel(module.type)} · {module.id}
                      </span>
                      <small>{module.message}</small>
                    </div>
                    <StatusBadge status={module.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </section>
  );
}

function FallbackGuidance({
  module,
  modules,
  results,
}: {
  module: RrrModule;
  modules: RrrModule[];
  results: RrrInteractionResult['modules'];
}) {
  if (!module.fallbackModuleId) {
    return null;
  }

  const fallbackModule = modules.find(
    (candidate) => candidate.id === module.fallbackModuleId,
  );
  const fallbackStatus = fallbackModule
    ? results[fallbackModule.id]?.status ?? 'running'
    : 'failed';

  return (
    <ModuleFeedback
      kind={
        fallbackModule
          ? moduleFeedbackKindFromStatus(fallbackStatus)
          : 'error'
      }
      eyebrow="Ersatzlösung"
      message="Falls dieser Schritt auf dem Gerät nicht funktioniert, kann alternativ diese Ersatzlösung verwendet werden."
      detail={
        fallbackModule
          ? `${fallbackModule.label} · ${getStatusLabel(fallbackStatus)}`
          : 'Die Ersatzlösung fehlt oder wurde gelöscht.'
      }
    />
  );
}

function GuidedControl({
  module,
  inputs,
  onPatchInputs,
}: {
  module: RrrModule;
  inputs: RrrMockInputs;
  onPatchInputs: (patch: Partial<RrrMockInputs>) => void;
}) {
  switch (module.type) {
    case 'compass_align': {
      const targetDegrees = normalizeDegrees(
        readNumber(module.config.targetDegrees),
      );
      const tolerance = Math.max(
        2,
        readNumber(module.config.tolerance) || 15,
      );
      return (
        <CompassControl
          heading={inputs.headingDegrees}
          targetDegrees={targetDegrees}
          tolerance={tolerance}
          onHeadingChange={(heading) => onPatchInputs({ headingDegrees: heading })}
        />
      );
    }
    case 'direction_hotcold': {
      const targetDegrees = normalizeDegrees(
        readNumber(module.config.targetDegrees),
      );
      const successTolerance = Math.max(
        2,
        readNumber(module.config.successTolerance) || 15,
      );
      return (
        <DirectionHotColdControl
          heading={inputs.headingDegrees}
          targetDegrees={targetDegrees}
          successTolerance={successTolerance}
          onHeadingChange={(heading) => onPatchInputs({ headingDegrees: heading })}
        />
      );
    }
    case 'gps_enter': {
      const lat = readNumber(module.config.lat);
      const lng = readNumber(module.config.lng);
      return (
        <div className="stq-rrr-guide__choice">
          <button
            type="button"
            className="stq-rrr-editor__button"
            onClick={() => onPatchInputs({ gpsLat: lat, gpsLng: lng })}
          >
            Innerhalb des Radius
          </button>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={() =>
              onPatchInputs({ gpsLat: lat + 0.01, gpsLng: lng + 0.01 })
            }
          >
            Außerhalb des Radius
          </button>
        </div>
      );
    }
    case 'proximity_hint': {
      const lat = readNumber(module.config.lat);
      const lng = readNumber(module.config.lng);
      const successRadiusMeters = Math.max(
        1,
        readNumber(module.config.successRadiusMeters) || 20,
      );
      return (
        <ProximityRadarControl
          currentLat={inputs.gpsLat}
          currentLng={inputs.gpsLng}
          targetLat={lat}
          targetLng={lng}
          successRadiusMeters={successRadiusMeters}
          onPositionChange={(position) =>
            onPatchInputs({ gpsLat: position.lat, gpsLng: position.lng })
          }
        />
      );
    }
    case 'hold_still':
      return (
        <label className="stq-rrr-check">
          <input
            type="checkbox"
            checked={inputs.isStill}
            onChange={(event) => onPatchInputs({ isStill: event.target.checked })}
          />
          <span>Stillhalten simulieren</span>
        </label>
      );
    case 'text_answer':
      return (
        <TextAnswerControl
          value={inputs.textAnswer}
          acceptedAnswers={readTextAnswers(module)}
          onValueChange={(textAnswer) => onPatchInputs({ textAnswer })}
        />
      );
    case 'multi_choice': {
      const question = readString(module.config.question).trim();
      const options = readStringArray(module.config.options);
      const correctOptionIndexes = readNumberArray(
        module.config.correctOptionIndexes,
      );
      const allowMultiple = Boolean(module.config.allowMultiple);
      const selected =
        inputs.multiChoiceSelectionsByModuleId[module.id] ?? [];

      function setSelected(next: number[]) {
        onPatchInputs({
          multiChoiceSelectionsByModuleId: {
            ...inputs.multiChoiceSelectionsByModuleId,
            [module.id]: next,
          },
        });
      }

      return (
        <fieldset className="stq-rrr-multi-choice-preview">
          <legend>{question || 'Auswahlfrage'}</legend>
          {options.map((option, index) => {
            const label = option.trim() || `Option ${index + 1}`;
            const checked = selected.includes(index);
            return (
              <label key={index} className="stq-rrr-check">
                <input
                  type={allowMultiple ? 'checkbox' : 'radio'}
                  name={`multi-choice-${module.id}`}
                  checked={checked}
                  onChange={(event) => {
                    if (allowMultiple) {
                      setSelected(
                        event.target.checked
                          ? [...new Set([...selected, index])]
                          : selected.filter((entry) => entry !== index),
                      );
                    } else {
                      setSelected([index]);
                    }
                  }}
                />
                <span>{label}</span>
              </label>
            );
          })}
          {correctOptionIndexes.length > 1 && !allowMultiple && (
            <small>
              Mehrere richtige Optionen sind konfiguriert. Aktiviere
              Mehrfachauswahl, wenn Spieler mehrere Antworten wählen sollen.
            </small>
          )}
        </fieldset>
      );
    }
    case 'qr_scan': {
      const expectedQrValue = readString(module.config.expectedValue).trim();
      const hasExpectedQrValue = expectedQrValue.length > 0;
      const hasFallbackModule = Boolean(module.fallbackModuleId);
      return (
        <div className="stq-rrr-guide__stack">
          <Suspense fallback={<QrScannerLoadingState />}>
            <QrScanner
              fallbackAvailable={hasFallbackModule}
              onScan={(value) => onPatchInputs({ qrScanValue: value })}
              onUseFallback={
                hasFallbackModule && hasExpectedQrValue
                  ? () => onPatchInputs({ qrScanValue: expectedQrValue })
                  : undefined
              }
            />
          </Suspense>
          <label className="stq-rrr-field">
            <span>Simulierter QR-Wert</span>
            <input
              type="text"
              value={inputs.qrScanValue}
              onChange={(event) =>
                onPatchInputs({ qrScanValue: event.target.value })
              }
            />
          </label>
        </div>
      );
    }
    case 'morse_code':
      return (
        <MorseCodeControl
          value={inputs.morseCodeValue}
          expectedPattern={readString(module.config.pattern)}
          shortAudioUrl={readString(module.config.shortAudioUrl)}
          longAudioUrl={readString(module.config.longAudioUrl)}
          onValueChange={(morseCodeValue) =>
            onPatchInputs({ morseCodeValue })
          }
        />
      );
    case 'code_word':
      return (
        <CodeEntryControl
          value={inputs.codeWordValue}
          expectedCode={readString(module.config.code)}
          variant="code_word"
          onValueChange={(codeWordValue) => onPatchInputs({ codeWordValue })}
        />
      );
    case 'sequential_code':
      return (
        <CodeEntryControl
          value={inputs.sequentialCodeValue}
          expectedCode={readString(module.config.code)}
          variant="sequential_code"
          onValueChange={(sequentialCodeValue) =>
            onPatchInputs({ sequentialCodeValue })
          }
        />
      );
    case 'timer_wait':
      return (
        <div className="stq-rrr-editor__empty">
          Die Wartezeit läuft über die Runtime-Sitzung. Starte den Test und
          prüfe den Schritt nach der Wartezeit erneut.
        </div>
      );
    case 'photo_check_manual': {
      const confirmed = inputs.photoCheckManualModuleIds.includes(module.id);
      const confirmLabel =
        readString(module.config.confirmLabel).trim() || 'Bestätigt';
      return (
        <div className="stq-rrr-guide__choice">
          <button
            type="button"
            className="stq-rrr-editor__button"
            disabled={confirmed}
            onClick={() =>
              onPatchInputs({
                photoCheckManualModuleIds: [
                  ...new Set([
                    ...inputs.photoCheckManualModuleIds,
                    module.id,
                  ]),
                ],
              })
            }
          >
            {confirmLabel}
          </button>
        </div>
      );
    }
    case 'object_found': {
      const confirmed = inputs.objectFoundModuleIds.includes(module.id);
      const confirmLabel =
        readString(module.config.confirmLabel).trim() || 'Gefunden';
      return (
        <div className="stq-rrr-guide__choice">
          <button
            type="button"
            className="stq-rrr-editor__button"
            disabled={confirmed}
            onClick={() =>
              onPatchInputs({
                objectFoundModuleIds: [
                  ...new Set([...inputs.objectFoundModuleIds, module.id]),
                ],
              })
            }
          >
            {confirmLabel}
          </button>
        </div>
      );
    }
  }
}

function QrScannerLoadingState() {
  return (
    <div className="stq-rrr-editor__empty" role="status" aria-live="polite">
      Loading QR scanner...
    </div>
  );
}

interface GuidedStep {
  module: RrrModule;
  index: number;
  total: number;
}

function getGuidedStep(
  interaction: RrrInteraction,
  evaluation: RrrInteractionResult,
  session: RrrRuntimeSession,
): GuidedStep | undefined {
  if (interaction.modules.length === 0) {
    return undefined;
  }

  const condition = interaction.condition;
  if (!condition) {
    return {
      module: interaction.modules[0],
      index: 0,
      total: interaction.modules.length,
    };
  }

  const orderedIds = getGuidedModuleIds(condition);
  if (orderedIds.length === 0) {
    return undefined;
  }

  const moduleById = new Map(
    interaction.modules.map((module) => [module.id, module]),
  );
  const visibleIds = orderedIds.filter((moduleId) => moduleById.has(moduleId));
  const activeId =
    condition.type === 'sequence'
      ? visibleIds[Math.min(session.activeSequenceIndex, visibleIds.length - 1)]
      : visibleIds.find(
          (moduleId) => evaluation.modules[moduleId]?.status !== 'success',
        ) ?? visibleIds[0];

  if (!activeId) {
    return undefined;
  }
  const module = moduleById.get(activeId);
  if (!module) {
    return undefined;
  }

  return {
    module,
    index: Math.max(visibleIds.indexOf(activeId), 0),
    total: visibleIds.length,
  };
}

function getGuidedModuleIds(condition: RrrCondition): string[] {
  if (condition.type === 'module') {
    return [condition.moduleId];
  }
  return getConditionChildren(condition).flatMap(getGuidedModuleIds);
}

function getPlayerInstruction(module: RrrModule): string {
  switch (module.type) {
    case 'text_answer':
      return 'Der Spieler gibt die Antwort ein.';
    case 'multi_choice':
      return (
        readString(module.config.question).trim() ||
        'Der Spieler wählt eine oder mehrere Antworten aus.'
      );
    case 'compass_align':
      return 'Der Spieler richtet das Gerät auf die Zielrichtung aus.';
    case 'direction_hotcold':
      return 'Der Spieler dreht sich zur Zielrichtung und erhält warm/kalt-Feedback.';
    case 'hold_still':
      return 'Der Spieler hält das Gerät ruhig.';
    case 'gps_enter':
      return 'Der Spieler steht am richtigen Ort innerhalb des Radius.';
    case 'proximity_hint':
      return 'Der Spieler nähert sich dem Zielort und erhält Nähe-Hinweise.';
    case 'qr_scan':
      return 'Der Spieler scannt den vorgesehenen QR-Code.';
    case 'morse_code':
      return 'Der Spieler hört den Morsecode und baut ihn mit kurz/lang nach.';
    case 'code_word':
      return 'Der Spieler gibt das gefundene Codewort ein.';
    case 'sequential_code':
      return 'Der Spieler gibt den unterwegs gesammelten Code ein.';
    case 'timer_wait':
      return 'Der Spieler wartet, bis die konfigurierte Zeit abgelaufen ist.';
    case 'photo_check_manual':
      return (
        readString(module.config.prompt).trim() ||
        'Der Spieler bestätigt die Foto-Aufgabe.'
      );
    case 'object_found':
      return (
        readString(module.config.prompt).trim() ||
        'Der Spieler bestätigt den Fund.'
      );
  }
}

function getModuleTypeLabel(type: RrrModuleType): string {
  switch (type) {
    case 'text_answer':
      return 'Textantwort';
    case 'multi_choice':
      return 'Auswahlfrage';
    case 'compass_align':
      return 'Richtung';
    case 'direction_hotcold':
      return 'Richtung warm/kalt';
    case 'hold_still':
      return 'Stillhalten';
    case 'gps_enter':
      return 'Ort';
    case 'proximity_hint':
      return 'Nähe-Hinweis';
    case 'qr_scan':
      return 'QR-Code';
    case 'morse_code':
      return 'Morsecode';
    case 'code_word':
      return 'Codewort';
    case 'sequential_code':
      return 'Gesammelter Code';
    case 'timer_wait':
      return 'Warten';
    case 'photo_check_manual':
      return 'Foto-Aufgabe';
    case 'object_found':
      return 'Objekt gefunden';
  }
}

function StatusBadge({ status }: { status: RrrMockStatus }) {
  return (
    <span className={`stq-rrr-status stq-rrr-status--${status}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function getStatusLabel(status: RrrMockStatus): string {
  switch (status) {
    case 'idle':
      return 'Bereit';
    case 'running':
      return 'Läuft';
    case 'success':
      return 'Erfüllt';
    case 'failed':
      return 'Fehlgeschlagen';
  }
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
}

function readTextAnswers(module: RrrModule): string[] {
  const acceptedAnswers = readStringArray(module.config.acceptedAnswers);
  const answer = readString(module.config.answer);
  return [...acceptedAnswers, answer].filter((entry) => entry.trim().length > 0);
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => Number.isInteger(entry) && entry >= 0)
    : [];
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
