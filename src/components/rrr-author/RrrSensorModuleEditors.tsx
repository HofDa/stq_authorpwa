import type { CSSProperties, PointerEvent } from 'react';
import type { RrrModule } from '@/rrr';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { recommendGpsRadius } from '@/rrr/sensors';
import {
  useLiveDeviceHeading,
  type LiveDeviceHeadingState,
} from '@/components/rrr-runtime/useLiveDeviceHeading';
import { RrrNumberField as NumberField } from './RrrNumberField';
import {
  COMPASS_DIRECTION_PRESETS,
  HOLD_STILL_DURATION_PRESETS,
  TIMER_WAIT_DURATION_PRESETS,
  clampNumber,
  formatDurationSeconds,
  formatEditorText,
  formatNumber,
  getCompassCardinalInitial,
  getCompassDirectionLabel,
  getGpsRadiusMeta,
  getHoldStillDurationMeta,
  getTimerWaitDurationMeta,
  normalizeCompassDegrees,
  normalizeDurationMs,
  readNumber,
} from './rrrInteractionEditorModel';

type PatchConfig = (patch: Record<string, unknown>) => void;

type CompassNeedleStyle = CSSProperties & {
  '--stq-rrr-compass-degrees': string;
};

export function HoldStillDurationEditor({
  config,
  expertMode,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 8000);
  const durationMeta = getHoldStillDurationMeta(durationMs, t);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label={t('rrr.editor.hold.aria')}
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>{t('rrr.editor.hold.duration')}</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.hold.slider')}</span>
          <input
            type="range"
            min="500"
            max="8000"
            step="100"
            value={durationSliderValue}
            onChange={(event) => setDurationMs(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {durationMeta.description}
          </small>
        </label>

        <div
          className="stq-rrr-hold-duration__presets"
          aria-label={t('rrr.editor.hold.presetsAria')}
        >
          {HOLD_STILL_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              className={`stq-rrr-hold-duration__preset ${
                durationMs === preset.durationMs ? 'is-active' : ''
              }`}
              onClick={() => setDurationMs(preset.durationMs)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.hold.expertLabel')}
          value={durationMs}
          onChange={setDurationMs}
        />
      )}
    </div>
  );
}

export function SafeDialEditor({
  config,
  expertMode,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const holdMs = normalizeDurationMs(readNumber(config.holdMs) || 900);
  const holdSliderValue = clampNumber(holdMs, 0, 3000);

  function setHoldMs(value: number) {
    onPatchConfig({ holdMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-safe-dial-editor">
      <CompassDirectionPicker
        config={config}
        expertMode={expertMode}
        toleranceLabel={t('rrr.editor.module.safeDialToleranceLabel')}
        toleranceHint={t('rrr.editor.module.safeDialToleranceHint')}
        onPatchConfig={onPatchConfig}
      />
      <label className="stq-rrr-field">
        <span>
          {t('rrr.editor.module.safeDialHoldLabel')}:{' '}
          {formatDurationSeconds(holdMs)}
        </span>
        <input
          type="range"
          min="0"
          max="3000"
          step="100"
          value={holdSliderValue}
          onChange={(event) => setHoldMs(Number(event.target.value))}
        />
        <small className="stq-rrr-field__hint">
          {t('rrr.editor.module.safeDialHoldHint')}
        </small>
      </label>
      {expertMode && (
        <NumberField
          label={t('rrr.editor.module.safeDialHoldExpertLabel')}
          value={holdMs}
          onChange={setHoldMs}
        />
      )}
    </div>
  );
}

export function CompassDirectionPicker({
  config,
  expertMode,
  toleranceConfigKey = 'tolerance',
  toleranceLabel,
  toleranceHint,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  toleranceConfigKey?: 'tolerance' | 'successTolerance';
  toleranceLabel?: string;
  toleranceHint?: string;
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const liveCompass = useLiveDeviceHeading();
  const resolvedToleranceLabel =
    toleranceLabel ?? t('rrr.editor.compass.defaultToleranceLabel');
  const resolvedToleranceHint =
    toleranceHint ?? t('rrr.editor.compass.defaultToleranceHint');
  const targetDegrees = normalizeCompassDegrees(readNumber(config.targetDegrees));
  const tolerance = Math.max(0, readNumber(config[toleranceConfigKey]));
  const toleranceSliderValue = Math.min(tolerance, 90);

  function setTargetDegrees(value: number) {
    onPatchConfig({ targetDegrees: normalizeCompassDegrees(value) });
  }

  function setTolerance(value: number) {
    onPatchConfig({ [toleranceConfigKey]: Math.max(0, value) });
  }

  function handleDialPointer(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const degrees = (Math.atan2(x, -y) * 180) / Math.PI;
    setTargetDegrees(degrees);
  }

  return (
    <div className="stq-rrr-compass-picker">
      <div className="stq-rrr-compass-picker__main">
        <button
          type="button"
          className="stq-rrr-compass-picker__dial"
          onPointerDown={handleDialPointer}
          aria-label={t('rrr.editor.compass.aria')}
        >
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--north">
            {getCompassCardinalInitial('rrr.editor.compass.north', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--east">
            {getCompassCardinalInitial('rrr.editor.compass.east', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--south">
            {getCompassCardinalInitial('rrr.editor.compass.south', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--west">
            {getCompassCardinalInitial('rrr.editor.compass.west', t)}
          </span>
          <span
            className="stq-rrr-compass-picker__needle"
            style={
              {
                '--stq-rrr-compass-degrees': `${targetDegrees}deg`,
              } as CompassNeedleStyle
            }
          />
          {liveCompass.heading !== undefined && (
            <span
              className="stq-rrr-compass-picker__needle stq-rrr-compass-picker__needle--live"
              style={
                {
                  '--stq-rrr-compass-degrees': `${liveCompass.heading}deg`,
                } as CompassNeedleStyle
              }
              aria-hidden
            />
          )}
          <span className="stq-rrr-compass-picker__center" />
        </button>

        <div className="stq-rrr-compass-picker__readout">
          <span>{t('rrr.editor.compass.selected')}</span>
          <strong>{formatNumber(targetDegrees, 0)}°</strong>
          <small>{getCompassDirectionLabel(targetDegrees, t)}</small>
          <LiveCompassControl state={liveCompass} />
        </div>
      </div>

      <div
        className="stq-rrr-compass-picker__presets"
        aria-label={t('rrr.editor.compass.presetsAria')}
      >
        {COMPASS_DIRECTION_PRESETS.map((preset) => (
          <button
            key={preset.degrees}
            type="button"
            className={`stq-rrr-compass-picker__preset ${
              targetDegrees === preset.degrees ? 'is-active' : ''
            }`}
            onClick={() => setTargetDegrees(preset.degrees)}
          >
            {t(preset.labelKey)} {preset.degrees}°
          </button>
        ))}
      </div>

      <div className="stq-rrr-compass-picker__tolerance">
        <label className="stq-rrr-field">
          <span>
            {resolvedToleranceLabel}: ±{formatNumber(tolerance, 0)}°
          </span>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={toleranceSliderValue}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {resolvedToleranceHint}
          </small>
        </label>
        <NumberField
          label={formatEditorText(t('rrr.editor.compass.toleranceDegrees'), {
            label: resolvedToleranceLabel,
          })}
          value={tolerance}
          onChange={setTolerance}
        />
      </div>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.compass.targetDegrees')}
          value={targetDegrees}
          onChange={setTargetDegrees}
        />
      )}
    </div>
  );
}

function LiveCompassControl({ state }: { state: LiveDeviceHeadingState }) {
  const { t } = useEditorLanguage();
  const status = state.status ?? 'idle';

  if (status === 'available' && state.heading !== undefined) {
    return (
      <small className="stq-rrr-compass-picker__live">
        {t('rrr.editor.compass.liveHeading')} {formatNumber(state.heading, 0)}°
      </small>
    );
  }

  if (status === 'unavailable') {
    return (
      <small className="stq-rrr-compass-picker__live stq-rrr-compass-picker__live--muted">
        {t('rrr.editor.compass.liveUnavailable')}
      </small>
    );
  }

  if (status === 'error') {
    return (
      <small className="stq-rrr-compass-picker__live stq-rrr-compass-picker__live--muted">
        {t('rrr.editor.compass.liveDenied')}
      </small>
    );
  }

  return (
    <button
      type="button"
      className="stq-rrr-compass-picker__live-button"
      onClick={state.start}
      disabled={status === 'starting'}
    >
      {status === 'starting'
        ? t('rrr.editor.compass.liveStarting')
        : t('rrr.editor.compass.liveEnable')}
    </button>
  );
}

export function GpsRadiusEditor({
  config,
  radiusConfigKey = 'radiusMeters',
  radiusLabel,
  radiusHint,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  radiusConfigKey?: 'radiusMeters' | 'successRadiusMeters';
  radiusLabel?: string;
  radiusHint?: string;
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const resolvedRadiusLabel = radiusLabel ?? t('rrr.editor.gps.radius');
  const radiusMeters = Math.max(0, readNumber(config[radiusConfigKey]));
  const radiusSliderValue = Math.min(radiusMeters, 100);
  const radiusMeta = getGpsRadiusMeta(radiusMeters, t);

  function setRadiusMeters(value: number) {
    onPatchConfig({ [radiusConfigKey]: Math.max(0, Math.round(value)) });
  }

  return (
    <div className="stq-rrr-gps-editor">
      <div className="stq-rrr-field-grid">
        <NumberField
          label={t('rrr.editor.gps.lat')}
          value={readNumber(config.lat)}
          onChange={(value) => onPatchConfig({ lat: value })}
        />
        <NumberField
          label={t('rrr.editor.gps.lng')}
          value={readNumber(config.lng)}
          onChange={(value) => onPatchConfig({ lng: value })}
        />
      </div>

      <section
        className="stq-rrr-gps-radius"
        aria-label={t('rrr.editor.gps.aria')}
      >
        <div className="stq-rrr-gps-radius__header">
          <div>
            <span>{resolvedRadiusLabel}</span>
            <strong>{formatNumber(radiusMeters, 0)} m</strong>
          </div>
          <span
            className={`stq-rrr-gps-radius__badge stq-rrr-gps-radius__badge--${radiusMeta.tone}`}
          >
            {radiusMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>
            {formatEditorText(t('rrr.editor.gps.slider'), {
              label: resolvedRadiusLabel,
            })}
          </span>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={radiusSliderValue}
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {radiusHint ?? radiusMeta.description}
          </small>
        </label>

        <NumberField
          label={formatEditorText(t('rrr.editor.gps.meters'), {
            label: resolvedRadiusLabel,
          })}
          value={radiusMeters}
          onChange={setRadiusMeters}
        />
        <p className="stq-rrr-gps-radius__calibration">
          {formatEditorText(t('rrr.editor.gps.calibration'), {
            radius: String(recommendGpsRadius()),
          })}
        </p>
      </section>
    </div>
  );
}

export function BalanceRunEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const timeLimitMs = Math.max(1000, readNumber(config.timeLimitMs) || 60000);
  const maxTiltDegrees = Math.max(1, readNumber(config.maxTiltDegrees) || 12);
  const successRadiusMeters = Math.max(
    1,
    readNumber(config.successRadiusMeters) || 20,
  );

  return (
    <div className="stq-rrr-gps-editor">
      <div className="stq-rrr-field-grid">
        <NumberField
          label={t('rrr.editor.balance.startLat')}
          value={readNumber(config.startLat)}
          onChange={(value) => onPatchConfig({ startLat: value })}
        />
        <NumberField
          label={t('rrr.editor.balance.startLng')}
          value={readNumber(config.startLng)}
          onChange={(value) => onPatchConfig({ startLng: value })}
        />
        <NumberField
          label={t('rrr.editor.balance.targetLat')}
          value={readNumber(config.targetLat)}
          onChange={(value) => onPatchConfig({ targetLat: value })}
        />
        <NumberField
          label={t('rrr.editor.balance.targetLng')}
          value={readNumber(config.targetLng)}
          onChange={(value) => onPatchConfig({ targetLng: value })}
        />
      </div>
      <label className="stq-rrr-field">
        <span>
          {t('rrr.editor.balance.radius')}:{' '}
          {formatNumber(successRadiusMeters, 0)} m
        </span>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={Math.min(successRadiusMeters, 100)}
          onChange={(event) =>
            onPatchConfig({
              successRadiusMeters: Math.max(1, Number(event.target.value)),
            })
          }
        />
        <small className="stq-rrr-field__hint">
          {t('rrr.editor.balance.radiusHint')}
        </small>
      </label>
      <div className="stq-rrr-field-grid">
        <NumberField
          label={t('rrr.editor.balance.timeLimitMs')}
          value={timeLimitMs}
          onChange={(value) =>
            onPatchConfig({ timeLimitMs: Math.max(1000, Math.round(value)) })
          }
        />
        <NumberField
          label={t('rrr.editor.balance.maxTiltDegrees')}
          value={maxTiltDegrees}
          onChange={(value) =>
            onPatchConfig({ maxTiltDegrees: Math.max(1, Math.round(value)) })
          }
        />
      </div>
    </div>
  );
}

export function TimerWaitDurationEditor({
  config,
  expertMode,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 30000);
  const durationMeta = getTimerWaitDurationMeta(durationMs, t);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label={t('rrr.editor.timer.aria')}
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>{t('rrr.editor.timer.wait')}</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.timer.slider')}</span>
          <input
            type="range"
            min="500"
            max="30000"
            step="500"
            value={durationSliderValue}
            onChange={(event) => setDurationMs(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {durationMeta.description}
          </small>
        </label>

        <div
          className="stq-rrr-hold-duration__presets"
          aria-label={t('rrr.editor.timer.presetsAria')}
        >
          {TIMER_WAIT_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              className={`stq-rrr-hold-duration__preset ${
                durationMs === preset.durationMs ? 'is-active' : ''
              }`}
              onClick={() => setDurationMs(preset.durationMs)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.timer.expertLabel')}
          value={durationMs}
          onChange={setDurationMs}
        />
      )}
    </div>
  );
}
