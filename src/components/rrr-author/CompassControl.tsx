import { useEffect } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { CompassDial } from '@/components/rrr-runtime/CompassDial';
import { useLiveDeviceHeading } from '@/components/rrr-runtime/useLiveDeviceHeading';

interface CompassControlProps {
  heading: number;
  targetDegrees: number;
  tolerance: number;
  onHeadingChange: (heading: number) => void;
}

export function CompassControl({
  heading,
  targetDegrees,
  tolerance,
  onHeadingChange,
}: CompassControlProps) {
  const { t } = useEditorLanguage();
  const live = useLiveDeviceHeading();

  useEffect(() => {
    if (live.status === 'available' && typeof live.heading === 'number') {
      onHeadingChange(live.heading);
    }
  }, [live.heading, live.status, onHeadingChange]);

  const sliderValue = Math.round(heading);

  return (
    <div className="stq-rrr-compass-control">
      <CompassDial
        heading={heading}
        targetDegrees={targetDegrees}
        tolerance={tolerance}
      />

      <div className="stq-rrr-compass-control__live">
        <LiveStatus status={live.status} heading={live.heading} t={t} />
        {live.status !== 'available' && (
          <button
            type="button"
            className="stq-rrr-compass-control__button"
            onClick={live.start}
            disabled={live.status === 'starting'}
          >
            {live.status === 'starting'
              ? t('rrr.editor.compass.liveStarting')
              : t('rrr.editor.compass.liveEnable')}
          </button>
        )}
      </div>

      <label className="stq-rrr-field">
        <span>
          {t('rrr.editor.compass.simulateHeading')}: {sliderValue} Grad
        </span>
        <input
          type="range"
          min="0"
          max="359"
          value={sliderValue}
          onChange={(event) => onHeadingChange(Number(event.target.value))}
          disabled={live.status === 'available'}
        />
      </label>

      <button
        type="button"
        className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
        onClick={() => onHeadingChange(targetDegrees)}
      >
        {t('rrr.editor.compass.simulateTarget')}
      </button>
    </div>
  );
}

function LiveStatus({
  status,
  heading,
  t,
}: {
  status: ReturnType<typeof useLiveDeviceHeading>['status'];
  heading: number | undefined;
  t: ReturnType<typeof useEditorLanguage>['t'];
}) {
  if (status === 'available' && heading !== undefined) {
    return (
      <small className="stq-rrr-compass-control__status">
        {t('rrr.editor.compass.liveHeading')} {Math.round(heading)}°
      </small>
    );
  }
  if (status === 'unavailable') {
    return (
      <small className="stq-rrr-compass-control__status stq-rrr-compass-control__status--muted">
        {t('rrr.editor.compass.liveUnavailable')}
      </small>
    );
  }
  if (status === 'error') {
    return (
      <small className="stq-rrr-compass-control__status stq-rrr-compass-control__status--muted">
        {t('rrr.editor.compass.liveDenied')}
      </small>
    );
  }
  return null;
}
