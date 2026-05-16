import { useEffect, useMemo, useState } from 'react';
import {
  createRrrFieldTestReport,
  downloadRrrFieldTestReport,
  getRrrWarnings,
  type RrrInteraction,
  type RrrModule,
} from '@/rrr';
import type { RrrFieldTestIssueTag } from '@/schema';
import {
  useRrrRuntimeBridge,
  type RrrRuntimeBridgeOptions,
  type RrrRuntimeSession,
} from '@/rrr/runtime';
import {
  createDeviceOrientationSensorAdapter,
  createGeolocationSensorAdapter,
  type RrrSensorAvailability,
  type RrrSensorState,
} from '@/rrr/sensors';
import {
  SensorPermissionGate,
  type SensorPermissionGateStatus,
} from '@/components/rrr-runtime/SensorPermissionGate';
import { GpsQualityBadge } from '@/components/rrr-runtime/GpsQualityBadge';

const FIELD_TEST_INTERACTION: RrrInteraction = {
  schemaVersion: 1,
  modules: [
    {
      id: 'field_gps',
      type: 'gps_enter',
      label: 'Zum Testpunkt gehen',
      config: {
        lat: 46.4983,
        lng: 11.3548,
        radiusMeters: 30,
      },
      timeoutMs: 30000,
      retry: {
        maxAttempts: 3,
      },
    },
    {
      id: 'field_compass',
      type: 'compass_align',
      label: 'Nach Osten schauen',
      config: {
        targetDegrees: 90,
        tolerance: 20,
      },
    },
    {
      id: 'field_still',
      type: 'hold_still',
      label: 'Handy ruhig halten',
      config: {
        durationMs: 2000,
      },
    },
  ],
  condition: {
    type: 'sequence',
    steps: [
      { type: 'module', moduleId: 'field_gps' },
      { type: 'module', moduleId: 'field_compass' },
      { type: 'module', moduleId: 'field_still' },
    ],
  },
};

export function RrrFieldTest() {
  const [permissionStatus, setPermissionStatus] =
    useState<SensorPermissionGateStatus>('idle');
  const [reportNotes, setReportNotes] = useState('');
  const [reportIssueTags, setReportIssueTags] = useState<RrrFieldTestIssueTag[]>([]);
  const adapters = useMemo(
    () => [
      createGeolocationSensorAdapter({
        positionOptions: {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 15000,
        },
      }),
      createDeviceOrientationSensorAdapter(),
    ],
    [],
  );
  const bridgeOptions = useMemo<RrrRuntimeBridgeOptions>(
    () => ({
      interaction: FIELD_TEST_INTERACTION,
      adapters,
      evaluationIntervalMs: 250,
    }),
    [adapters],
  );
  const { bridge, snapshot, start, stop, reset, retry } =
    useRrrRuntimeBridge(bridgeOptions);
  const {
    rawSensorState,
    sensorState,
    session,
    result,
    mockState,
    stillness,
    smoothing,
  } = snapshot;

  useEffect(() => {
    if (permissionStatus === 'idle' || permissionStatus === 'requesting') {
      return;
    }
    setPermissionStatus(getPermissionStatus(rawSensorState));
  }, [permissionStatus, rawSensorState]);

  const activeModule = getActiveModule(FIELD_TEST_INTERACTION, session);
  const activeModuleResult = activeModule ? result.modules[activeModule.id] : null;
  const configuredGpsRadius = getConfiguredGpsRadius(FIELD_TEST_INTERACTION);
  const secureContextWarning = isInInsecureBrowserContext();
  const fallbackMessages = getFallbackMessages(
    rawSensorState,
    secureContextWarning,
    smoothing.gpsIgnoredReason,
  );

  async function handleRequestPermissions() {
    setPermissionStatus('requesting');
    await start();
    setPermissionStatus(getPermissionStatus(bridge.getSnapshot().rawSensorState));
  }

  function handleStop() {
    stop();
    setPermissionStatus('idle');
  }

  function handleReset() {
    reset();
  }

  function handleRetry() {
    retry(activeModule?.id, {
      resetProgress: activeModule?.retry?.resetOnFail,
    });
  }

  function handleExportReport() {
    downloadRrrFieldTestReport(
      createRrrFieldTestReport({
        station: {
          id: 'rrr-field-test',
          title: 'RRR Field-Test',
        },
        interaction: FIELD_TEST_INTERACTION,
        finalResult: result.status,
        result,
        sensors: {
          gps: sensorState.geolocationStatus,
          orientation: sensorState.orientationStatus,
          motion: mockState.isStill ? 'available' : undefined,
          gpsAccuracyMeters: rawSensorState.accuracy,
        },
        warnings: getRrrWarnings(FIELD_TEST_INTERACTION),
        notes: reportNotes,
        issueTags: reportIssueTags,
      }),
    );
  }

  return (
    <section className="stq-rrr-field-test" aria-label="RRR field test">
      <div className="stq-rrr-field-test__header">
        <div>
          <p>Entwicklungsseite</p>
          <h1>RRR Field-Test</h1>
          <span>Live-Sensoren · GPS → Kompass → Stillhalten</span>
        </div>
        <div className="stq-rrr-field-test__actions">
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={handleStop}
            disabled={!snapshot.started}
          >
            Sensoren stoppen
          </button>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      <SensorPermissionGate
        requirements={['gps', 'orientation']}
        status={permissionStatus}
        onRequestPermissions={handleRequestPermissions}
      />

      {fallbackMessages.length > 0 && (
        <div className="stq-rrr-field-test__fallback" role="status">
          {fallbackMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="stq-rrr-field-test__grid">
        <article className="stq-rrr-field-test__panel">
          <h2>Aktueller Schritt</h2>
          {activeModule ? (
            <>
              <p className="stq-rrr-field-test__eyebrow">
                Schritt {session.activeSequenceIndex + 1} von{' '}
                {FIELD_TEST_INTERACTION.modules.length}
              </p>
              <strong>{activeModule.label}</strong>
              <span>{getModuleInstruction(activeModule)}</span>
              <div
                className={`stq-rrr-field-test__runtime stq-rrr-field-test__runtime--${
                  activeModuleResult?.status ?? 'idle'
                }`}
              >
                {activeModuleResult?.message ?? 'Warte auf Sensorwerte'}
              </div>
              {activeModuleResult?.timeout?.retryable && (
                <button
                  type="button"
                  className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                  onClick={handleRetry}
                >
                  Noch einmal versuchen
                </button>
              )}
            </>
          ) : (
            <>
              <p className="stq-rrr-field-test__eyebrow">Abgeschlossen</p>
              <strong>Alle Schritte erfüllt</strong>
              <span>Der Runtime-Status steht auf Erfolg.</span>
            </>
          )}
        </article>

        <article className="stq-rrr-field-test__panel">
          <h2>Runtime</h2>
          <dl className="stq-rrr-field-test__facts">
            <div>
              <dt>Status</dt>
              <dd>{result.status}</dd>
            </div>
            <div>
              <dt>Abgeschlossen</dt>
              <dd>{session.completedModuleIds.length}</dd>
            </div>
            <div>
              <dt>Stillhalten</dt>
              <dd>{mockState.isStill ? 'ruhig' : 'in Bewegung'}</dd>
            </div>
          </dl>
        </article>

        <article className="stq-rrr-field-test__panel">
          <h2>Live-Sensorwerte</h2>
          <dl className="stq-rrr-field-test__facts">
            <div>
              <dt>GPS</dt>
              <dd>{formatAvailability(sensorState.geolocationStatus)}</dd>
            </div>
            <div>
              <dt>Kompass</dt>
              <dd>{formatAvailability(sensorState.orientationStatus)}</dd>
            </div>
            <div>
              <dt>Richtung</dt>
              <dd>{formatDegrees(sensorState.heading)}</dd>
            </div>
            <div>
              <dt>GPS-Genauigkeit</dt>
              <dd>{formatMeters(rawSensorState.accuracy)}</dd>
            </div>
            <div>
              <dt>Position geglättet</dt>
              <dd>{formatPosition(sensorState)}</dd>
            </div>
            <div>
              <dt>Letzte Bewegung</dt>
              <dd>{formatLastMovement(stillness.lastMovementAt)}</dd>
            </div>
          </dl>
          <GpsQualityBadge
            accuracyMeters={rawSensorState.accuracy}
            configuredRadiusMeters={configuredGpsRadius}
          />
        </article>

        <article className="stq-rrr-field-test__panel">
          <h2>Sequenz</h2>
          <ol className="stq-rrr-field-test__steps">
            {FIELD_TEST_INTERACTION.modules.map((module, index) => {
              const moduleResult = result.modules[module.id];
              const isActive = activeModule?.id === module.id;
              return (
                <li
                  key={module.id}
                  className={isActive ? 'is-active' : undefined}
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{module.label}</strong>
                    <small>{moduleResult?.status ?? 'idle'}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </article>

        <article className="stq-rrr-field-test__panel">
          <h2>Testbericht</h2>
          <label className="stq-rrr-field">
            <span>Notizen</span>
            <textarea
              value={reportNotes}
              onChange={(event) => setReportNotes(event.target.value)}
              placeholder="Optional: Beobachtungen aus dem Feldtest"
            />
          </label>
          <div className="stq-rrr-field-test-tags" aria-label="Feldtest-Problem-Tags">
            {FIELD_TEST_ISSUE_TAG_OPTIONS.map((option) => (
              <label key={option.value} className="stq-rrr-check">
                <input
                  type="checkbox"
                  checked={reportIssueTags.includes(option.value)}
                  onChange={(event) =>
                    setReportIssueTags((current) =>
                      event.target.checked
                        ? [...new Set([...current, option.value])]
                        : current.filter((tag) => tag !== option.value),
                    )
                  }
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="stq-rrr-editor__button"
            onClick={handleExportReport}
          >
            Testbericht exportieren
          </button>
        </article>
      </div>
    </section>
  );
}

const FIELD_TEST_ISSUE_TAG_OPTIONS: Array<{
  value: RrrFieldTestIssueTag;
  label: string;
}> = [
  { value: 'gps_ungenau', label: 'GPS ungenau' },
  { value: 'kompass_instabil', label: 'Kompass instabil' },
  { value: 'qr_schlecht_lesbar', label: 'QR schlecht lesbar' },
  { value: 'aufgabe_unklar', label: 'Aufgabe unklar' },
  { value: 'ort_schwer_zugaenglich', label: 'Ort schwer zugänglich' },
  { value: 'ersatzloesung_noetig', label: 'Ersatzlösung nötig' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

function getConfiguredGpsRadius(interaction: RrrInteraction): number | undefined {
  const gpsModule = interaction.modules.find(
    (module) => module.type === 'gps_enter',
  );
  const radius = gpsModule?.config.radiusMeters;
  return typeof radius === 'number' && Number.isFinite(radius) ? radius : undefined;
}

function getActiveModule(
  interaction: RrrInteraction,
  session: RrrRuntimeSession,
): RrrModule | null {
  return interaction.modules[session.activeSequenceIndex] ?? null;
}

function getModuleInstruction(module: RrrModule): string {
  switch (module.type) {
    case 'gps_enter':
      return 'Gehe an den Testpunkt, bis die GPS-Position im Radius liegt.';
    case 'proximity_hint':
      return 'Gehe zum Zielort, bis der Nähe-Hinweis den Zielradius meldet.';
    case 'balance_run':
      return 'Starte am Startpunkt, gehe rechtzeitig zum Ziel und halte das Handy in Balance.';
    case 'compass_align':
      return 'Drehe dich mit dem Handy nach Osten.';
    case 'safe_dial':
      return 'Drehe das Handy wie ein Tresor-Drehrad bis zur Codeposition.';
    case 'direction_hotcold':
      return 'Drehe dich mit dem Handy, bis das warm/kalt-Feedback korrekt wird.';
    case 'hold_still':
      return 'Halte das Handy ruhig, bis die Live-Orientierung stabil bleibt.';
    case 'text_answer':
      return 'Gib die erwartete Antwort ein.';
    case 'multi_choice':
      return 'Wähle die passende Antwortoption aus.';
    case 'qr_scan':
      return 'QR-Scan ist in diesem Feldtest noch nicht verfügbar.';
    case 'morse_code':
      return 'Höre den Morsecode und gib kurz/lang mit den Tasten nach.';
    case 'code_word':
      return 'Gib das erwartete Codewort ein.';
    case 'sequential_code':
      return 'Gib den unterwegs gesammelten Code ein.';
    case 'timer_wait':
      return 'Warte, bis die konfigurierte Zeit abgelaufen ist.';
    case 'photo_check_manual':
      return 'Bestätige die Foto-Aufgabe manuell.';
    case 'object_found':
      return 'Bestätige manuell, dass das Objekt gefunden wurde.';
  }
}

function getPermissionStatus(
  state: RrrSensorState,
): SensorPermissionGateStatus {
  const statuses = [state.geolocationStatus, state.orientationStatus];
  if (state.error?.code === 'permission_denied') {
    return 'denied';
  }
  if (statuses.includes('unavailable') || statuses.includes('error')) {
    return 'unavailable';
  }
  if (statuses.includes('starting')) {
    return 'requesting';
  }
  if (statuses.every((status) => status === 'idle' || status === undefined)) {
    return 'idle';
  }
  return 'granted';
}

function getFallbackMessages(
  state: RrrSensorState,
  insecureContext: boolean,
  gpsIgnoredReason?: 'missing_coordinates' | 'poor_accuracy',
): string[] {
  const messages: string[] = [];
  if (insecureContext) {
    messages.push(
      'Sensoren funktionieren auf vielen Smartphones nur über HTTPS oder localhost.',
    );
  }
  if (state.geolocationStatus === 'unavailable' || state.geolocationStatus === 'error') {
    messages.push('GPS ist auf diesem Gerät oder in diesem Browser nicht verfügbar.');
  }
  if (
    state.orientationStatus === 'unavailable' ||
    state.orientationStatus === 'error'
  ) {
    messages.push(
      'Kompass/Orientierung ist nicht verfügbar. Der Kompass- und Stillhalte-Schritt bleiben dann im Wartezustand.',
    );
  }
  if (state.error) {
    messages.push(state.error.message);
  }
  if (gpsIgnoredReason === 'poor_accuracy') {
    messages.push(
      'Die letzte GPS-Messung wurde wegen sehr schlechter Genauigkeit nicht für die Auswertung verwendet.',
    );
  }
  return [...new Set(messages)];
}

function isInInsecureBrowserContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext === false;
}

function formatAvailability(status: RrrSensorAvailability | undefined): string {
  switch (status) {
    case 'idle':
      return 'noch nicht gestartet';
    case 'starting':
      return 'startet';
    case 'available':
      return 'verfügbar';
    case 'unavailable':
      return 'nicht verfügbar';
    case 'error':
      return 'Fehler';
    default:
      return 'unbekannt';
  }
}

function formatDegrees(value: number | undefined): string {
  return isFiniteNumber(value) ? `${Math.round(value)}°` : 'nicht verfügbar';
}

function formatMeters(value: number | undefined): string {
  return isFiniteNumber(value) ? `${Math.round(value)} m` : 'nicht verfügbar';
}

function formatPosition(state: RrrSensorState): string {
  if (!isFiniteNumber(state.latitude) || !isFiniteNumber(state.longitude)) {
    return 'nicht verfügbar';
  }
  return `${state.latitude.toFixed(5)}, ${state.longitude.toFixed(5)}`;
}

function formatLastMovement(timestamp: number | undefined): string {
  if (!timestamp) {
    return 'noch keine Messung';
  }
  return `${Math.max(0, Math.round((Date.now() - timestamp) / 1000))} s`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
