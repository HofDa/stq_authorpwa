import { useEffect, useMemo, useState } from 'react';
import type { RrrInteraction, RrrModule } from '@/rrr';
import {
  useRrrRuntimeBridge,
  type RrrRuntimeBridgeOptions,
  type RrrRuntimeSession,
} from '@/rrr-runtime';
import {
  createDeviceOrientationSensorAdapter,
  createGeolocationSensorAdapter,
  type RrrSensorAvailability,
  type RrrSensorState,
} from '@/rrr-sensors';
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
      </div>
    </section>
  );
}

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
    case 'compass_align':
      return 'Drehe dich mit dem Handy nach Osten.';
    case 'hold_still':
      return 'Halte das Handy ruhig, bis die Live-Orientierung stabil bleibt.';
    case 'text_answer':
      return 'Gib die erwartete Antwort ein.';
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
