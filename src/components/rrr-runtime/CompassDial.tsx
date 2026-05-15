interface CompassDialProps {
  heading: number;
  targetDegrees: number;
  tolerance: number;
  size?: number;
}

export function CompassDial({
  heading,
  targetDegrees,
  tolerance,
  size = 220,
}: CompassDialProps) {
  const center = size / 2;
  const radius = center - 14;
  const rotation = -heading;
  const aligned = isAligned(heading, targetDegrees, tolerance);

  return (
    <div
      className={`stq-rrr-compass-dial${aligned ? ' stq-rrr-compass-dial--aligned' : ''}`}
      style={{ width: size, height: size }}
    >
      <div className="stq-rrr-compass-dial__ring" />
      <svg
        className="stq-rrr-compass-dial__rose"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <DialTicks center={center} radius={radius} />
        <TargetArc
          center={center}
          radius={radius - 4}
          targetDegrees={targetDegrees}
          tolerance={tolerance}
        />
        <Cardinals center={center} radius={radius} rotation={rotation} />
      </svg>
      <div className="stq-rrr-compass-dial__hub">
        <span className="stq-rrr-compass-dial__degrees">
          {Math.round(normalize(heading))}°
        </span>
        <span className="stq-rrr-compass-dial__label">
          {getCardinal(targetDegrees)}
        </span>
      </div>
      <div className="stq-rrr-compass-dial__pointer" aria-hidden />
    </div>
  );
}

function DialTicks({ center, radius }: { center: number; radius: number }) {
  const ticks = [];
  for (let i = 0; i < 72; i++) {
    const angle = ((i * 5 - 90) * Math.PI) / 180;
    const major = i % 6 === 0;
    const length = major ? 10 : 5;
    ticks.push(
      <line
        key={i}
        x1={center + Math.cos(angle) * (radius - 2)}
        y1={center + Math.sin(angle) * (radius - 2)}
        x2={center + Math.cos(angle) * (radius - 2 - length)}
        y2={center + Math.sin(angle) * (radius - 2 - length)}
        className={
          major
            ? 'stq-rrr-compass-dial__tick stq-rrr-compass-dial__tick--major'
            : 'stq-rrr-compass-dial__tick'
        }
      />,
    );
  }
  return <>{ticks}</>;
}

function TargetArc({
  center,
  radius,
  targetDegrees,
  tolerance,
}: {
  center: number;
  radius: number;
  targetDegrees: number;
  tolerance: number;
}) {
  const clampedTolerance = Math.max(2, Math.min(90, tolerance));
  const a0 = ((targetDegrees - clampedTolerance - 90) * Math.PI) / 180;
  const a1 = ((targetDegrees + clampedTolerance - 90) * Math.PI) / 180;
  const path = [
    `M ${center + Math.cos(a0) * radius} ${center + Math.sin(a0) * radius}`,
    `A ${radius} ${radius} 0 0 1 ${center + Math.cos(a1) * radius} ${center + Math.sin(a1) * radius}`,
  ].join(' ');
  return <path d={path} className="stq-rrr-compass-dial__arc" />;
}

const CARDINALS: Array<{ label: string; degrees: number }> = [
  { label: 'N', degrees: 0 },
  { label: 'O', degrees: 90 },
  { label: 'S', degrees: 180 },
  { label: 'W', degrees: 270 },
];

function Cardinals({
  center,
  radius,
  rotation,
}: {
  center: number;
  radius: number;
  rotation: number;
}) {
  return (
    <>
      {CARDINALS.map(({ label, degrees }) => {
        const angle = ((degrees - 90) * Math.PI) / 180;
        const r = radius - 26;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        return (
          <text
            key={label}
            x={x}
            y={y}
            transform={`rotate(${-rotation} ${x} ${y})`}
            className="stq-rrr-compass-dial__cardinal"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </text>
        );
      })}
    </>
  );
}

function normalize(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function isAligned(
  heading: number,
  targetDegrees: number,
  tolerance: number,
): boolean {
  const diff = Math.abs(normalize(heading) - normalize(targetDegrees));
  const wrapped = Math.min(diff, 360 - diff);
  return wrapped <= Math.max(1, tolerance);
}

function getCardinal(degrees: number): string {
  const n = normalize(degrees);
  if (n < 22.5 || n >= 337.5) return 'NORDEN';
  if (n < 67.5) return 'NORDOSTEN';
  if (n < 112.5) return 'OSTEN';
  if (n < 157.5) return 'SÜDOSTEN';
  if (n < 202.5) return 'SÜDEN';
  if (n < 247.5) return 'SÜDWESTEN';
  if (n < 292.5) return 'WESTEN';
  return 'NORDWESTEN';
}
