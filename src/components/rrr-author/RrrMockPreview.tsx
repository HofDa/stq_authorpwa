import { useEffect, useMemo, useReducer, useState } from 'react';
import type { RrrInteraction } from '@/rrr';
import { evaluateMockInteraction } from '@/rrr-preview/evaluateMockInteraction';
import type { RrrMockInputs, RrrMockStatus } from '@/rrr-preview/types';
import {
  createRrrRuntimeSession,
  evaluateInteraction,
  reduceRrrRuntimeSession,
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
}: {
  interaction: RrrInteraction;
}) {
  const [inputs, setInputs] = useState<RrrMockInputs>(INITIAL_INPUTS);
  const [session, dispatchSession] = useReducer(
    reduceRrrRuntimeSession,
    undefined,
    createRrrRuntimeSession,
  );
  const [autoEvaluate, setAutoEvaluate] = useState(false);
  const evaluation = useMemo(
    () => evaluateMockInteraction(interaction, inputs),
    [interaction, inputs],
  );
  const sessionEvaluation = useMemo(
    () =>
      evaluateInteraction(
        interaction,
        {
          headingDegrees: inputs.headingDegrees,
          gpsLat: inputs.gpsLat,
          gpsLng: inputs.gpsLng,
          isStill: inputs.isStill,
        },
        { textAnswer: inputs.textAnswer },
        session,
      ),
    [interaction, inputs, session],
  );

  function patchInputs(patch: Partial<RrrMockInputs>) {
    setInputs((current) => ({
      ...current,
      ...patch,
    }));
  }

  function handleStart() {
    dispatchSession({ type: 'reset' });
    dispatchSession({ type: 'evaluation', result: sessionEvaluation });
  }

  function handleReset() {
    dispatchSession({ type: 'reset' });
  }

  function handleStep() {
    dispatchSession({ type: 'evaluation', result: sessionEvaluation });
  }

  useEffect(() => {
    if (!autoEvaluate) return;
    if (session.status === 'idle' || session.status === 'success' || session.status === 'failed') {
      return;
    }
    dispatchSession({ type: 'evaluation', result: sessionEvaluation });
  }, [autoEvaluate, sessionEvaluation, session.status]);

  return (
    <section className="stq-rrr-mock" aria-label="RRR mock preview">
      <div className="stq-rrr-mock__header">
        <div>
          <strong>Mock preview</strong>
          <span>Manual values only. No browser sensors are used.</span>
        </div>
        <StatusBadge status={evaluation.status} />
      </div>

      <div className="stq-rrr-mock__controls">
        <label className="stq-rrr-field">
          <span>Heading: {Math.round(inputs.headingDegrees)} degrees</span>
          <input
            type="range"
            min="0"
            max="359"
            value={inputs.headingDegrees}
            onChange={(event) =>
              patchInputs({ headingDegrees: readNumber(event.target.value) })
            }
          />
        </label>

        <div className="stq-rrr-field-grid">
          <NumberControl
            label="GPS latitude"
            value={inputs.gpsLat}
            onChange={(gpsLat) => patchInputs({ gpsLat })}
          />
          <NumberControl
            label="GPS longitude"
            value={inputs.gpsLng}
            onChange={(gpsLng) => patchInputs({ gpsLng })}
          />
        </div>

        <label className="stq-rrr-check">
          <input
            type="checkbox"
            checked={inputs.isStill}
            onChange={(event) => patchInputs({ isStill: event.target.checked })}
          />
          <span>Stillness toggle</span>
        </label>

        <label className="stq-rrr-field">
          <span>Text answer</span>
          <input
            type="text"
            value={inputs.textAnswer}
            onChange={(event) => patchInputs({ textAnswer: event.target.value })}
          />
        </label>
      </div>

      <div className="stq-rrr-mock__result">
        <div className="stq-rrr-mock__condition">
          <span>Condition</span>
          <strong>{evaluation.condition.message}</strong>
          <StatusBadge status={evaluation.condition.status} />
        </div>

        <RrrConditionStatusTree
          condition={interaction.condition}
          modules={evaluation.modules}
        />

        {Object.keys(evaluation.modules).length === 0 ? (
          <div className="stq-rrr-editor__empty">
            Add modules to see mock module status.
          </div>
        ) : (
          <div className="stq-rrr-mock__modules">
            {Object.values(evaluation.modules).map((module) => (
              <div key={module.id} className="stq-rrr-mock__module">
                <div>
                  <strong>{module.label}</strong>
                  <span>
                    {module.type} · {module.id}
                  </span>
                  <small>{module.message}</small>
                </div>
                <StatusBadge status={module.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="stq-rrr-mock__session"
        aria-label="RRR session controls"
      >
        <div className="stq-rrr-mock__header">
          <div>
            <strong>Session</strong>
            <span>
              Drive evaluation step-by-step. Author/debug only.
            </span>
          </div>
          <StatusBadge status={session.status} />
        </div>

        <div className="stq-rrr-mock__session-controls">
          <button
            type="button"
            onClick={handleStart}
            disabled={session.status !== 'idle'}
          >
            Start
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <button
            type="button"
            onClick={handleStep}
            disabled={session.status === 'idle'}
          >
            Step / evaluate
          </button>
          <label className="stq-rrr-check">
            <input
              type="checkbox"
              checked={autoEvaluate}
              onChange={(event) => setAutoEvaluate(event.target.checked)}
            />
            <span>Auto evaluate on change</span>
          </label>
        </div>

        <dl className="stq-rrr-mock__session-stats">
          <div>
            <dt>Status</dt>
            <dd>{session.status}</dd>
          </div>
          <div>
            <dt>Active step</dt>
            <dd>{session.activeSequenceIndex}</dd>
          </div>
          <div>
            <dt>Completed modules</dt>
            <dd>
              {session.completedModuleIds.length === 0
                ? '—'
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
                    {module.type} · {module.id}
                  </span>
                  <small>{module.message}</small>
                </div>
                <StatusBadge status={module.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NumberControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="stq-rrr-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? String(value) : '0'}
        onChange={(event) => onChange(readNumber(event.target.value))}
      />
    </label>
  );
}

function StatusBadge({ status }: { status: RrrMockStatus }) {
  return (
    <span className={`stq-rrr-status stq-rrr-status--${status}`}>
      {status}
    </span>
  );
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
