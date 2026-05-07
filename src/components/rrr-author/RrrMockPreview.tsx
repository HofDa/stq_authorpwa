import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  getConditionChildren,
  type RrrCondition,
  type RrrInteraction,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import { evaluateMockInteraction } from '@/rrr-preview/evaluateMockInteraction';
import type { RrrMockInputs, RrrMockStatus } from '@/rrr-preview/types';
import {
  createRrrRuntimeSession,
  evaluateInteraction,
  reduceRrrRuntimeSession,
  type RrrInteractionResult,
  type RrrRuntimeSession,
} from '@/rrr-runtime';
import { RrrConditionStatusTree } from './RrrConditionStatusTree';

const INITIAL_INPUTS: RrrMockInputs = {
  headingDegrees: 0,
  gpsLat: 0,
  gpsLng: 0,
  isStill: false,
  textAnswer: '',
};

export function RrrMockPreview({
  interaction,
  expertMode = false,
}: {
  interaction: RrrInteraction;
  expertMode?: boolean;
}) {
  const [inputs, setInputs] = useState<RrrMockInputs>(INITIAL_INPUTS);
  const [session, dispatchSession] = useReducer(
    reduceRrrRuntimeSession,
    undefined,
    createRrrRuntimeSession,
  );
  const sessionRef = useRef(session);
  const [autoEvaluate, setAutoEvaluate] = useState(false);
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
    () => ({ textAnswer: inputs.textAnswer }),
    [inputs.textAnswer],
  );
  const evaluation = useMemo(
    () => evaluateMockInteraction(interaction, inputs),
    [interaction, inputs],
  );
  const sessionEvaluation = useMemo(
    () => evaluateInteraction(interaction, inputState, userInput, session),
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
    const firstEvaluation = evaluateInteraction(
      interaction,
      inputState,
      userInput,
      freshSession,
    );
    dispatchSession({ type: 'reset' });
    dispatchSession({ type: 'evaluation', result: firstEvaluation });
  }

  function handleReset() {
    dispatchSession({ type: 'reset' });
    setInputs(INITIAL_INPUTS);
  }

  function handleStep() {
    dispatchSession({ type: 'evaluation', result: sessionEvaluation });
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
    dispatchSession({
      type: 'evaluation',
      result: evaluateInteraction(
        interaction,
        inputState,
        userInput,
        currentSession,
      ),
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
            <GuidedControl
              module={activeStep.module}
              inputs={inputs}
              onPatchInputs={patchInputs}
            />
            <div className="stq-rrr-guide__feedback">
              <div>
                <span>Rückmeldung</span>
                <strong>{activeResult?.message ?? 'Warte auf Eingabe'}</strong>
              </div>
              <StatusBadge status={activeResult?.status ?? 'running'} />
            </div>
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
        <div className="stq-rrr-guide__feedback stq-rrr-guide__feedback--success">
          <div>
            <span>Testergebnis</span>
            <strong>Das Rätsel wurde erfolgreich gelöst.</strong>
          </div>
          <StatusBadge status="success" />
        </div>
      )}

      {session.status === 'failed' && (
        <div className="stq-rrr-guide__feedback stq-rrr-guide__feedback--failed">
          <div>
            <span>Testergebnis</span>
            <strong>Dieser Testlauf ist fehlgeschlagen. Setze ihn zurück.</strong>
          </div>
          <StatusBadge status="failed" />
        </div>
      )}

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
      return (
        <label className="stq-rrr-field">
          <span>
            Richtung simulieren: {Math.round(inputs.headingDegrees)} Grad
          </span>
          <input
            type="range"
            min="0"
            max="359"
            value={inputs.headingDegrees}
            onChange={(event) =>
              onPatchInputs({ headingDegrees: readNumber(event.target.value) })
            }
          />
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={() => onPatchInputs({ headingDegrees: targetDegrees })}
          >
            Zielrichtung setzen
          </button>
        </label>
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
        <label className="stq-rrr-field">
          <span>Antwort eingeben</span>
          <input
            type="text"
            value={inputs.textAnswer}
            onChange={(event) => onPatchInputs({ textAnswer: event.target.value })}
          />
        </label>
      );
  }
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
    case 'compass_align':
      return 'Der Spieler richtet das Gerät auf die Zielrichtung aus.';
    case 'hold_still':
      return 'Der Spieler hält das Gerät ruhig.';
    case 'gps_enter':
      return 'Der Spieler steht am richtigen Ort innerhalb des Radius.';
  }
}

function getModuleTypeLabel(type: RrrModuleType): string {
  switch (type) {
    case 'text_answer':
      return 'Textantwort';
    case 'compass_align':
      return 'Richtung';
    case 'hold_still':
      return 'Stillhalten';
    case 'gps_enter':
      return 'Ort';
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

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}
