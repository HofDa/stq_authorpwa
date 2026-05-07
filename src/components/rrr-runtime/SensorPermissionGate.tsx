export type SensorRequirement = 'gps' | 'orientation' | 'motion';

export type SensorPermissionGateStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export type SensorPermissionGateProps = {
  requirements: SensorRequirement[];
  onRequestPermissions: () => Promise<void>;
  status?: SensorPermissionGateStatus;
};

const SENSOR_LABELS: Record<SensorRequirement, string> = {
  gps: 'GPS location',
  orientation: 'Compass heading',
  motion: 'Motion sensor',
};

const STATUS_MESSAGES: Record<SensorPermissionGateStatus, string> = {
  idle: 'Sensors stay off until you activate them.',
  requesting: 'Requesting sensor access...',
  granted: 'Sensor access is active.',
  denied: 'Sensor access was denied. Check browser or system permissions.',
  unavailable: 'One or more required sensors are unavailable on this device.',
};

export function SensorPermissionGate({
  requirements,
  onRequestPermissions,
  status = 'idle',
}: SensorPermissionGateProps) {
  const requirementLabels = requirements.map(
    (requirement) => SENSOR_LABELS[requirement],
  );
  const isBlocked = status === 'requesting' || status === 'granted';
  const statusTone =
    status === 'denied' || status === 'unavailable' ? 'error' : status;

  return (
    <section
      className={`stq-sensor-gate stq-sensor-gate--${statusTone}`}
      aria-label="Sensor permissions"
    >
      <div className="stq-sensor-gate__header">
        <div>
          <strong>Activate sensors</strong>
          <span>
            This riddle needs live device signals before it can evaluate your
            progress.
          </span>
        </div>
      </div>

      <ul className="stq-sensor-gate__requirements" aria-label="Required sensors">
        {requirementLabels.map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>

      <div
        className="stq-sensor-gate__status"
        role={statusTone === 'error' ? 'alert' : 'status'}
      >
        {STATUS_MESSAGES[status]}
      </div>

      <button
        type="button"
        className="stq-rrr-editor__button stq-sensor-gate__button"
        onClick={onRequestPermissions}
        disabled={isBlocked}
      >
        {status === 'requesting' ? 'Requesting...' : 'Activate sensors'}
      </button>
    </section>
  );
}
