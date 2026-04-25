type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'plus'
  | 'map-pin'
  | 'camera'
  | 'route'
  | 'grid'
  | 'download'
  | 'check'
  | 'sparkles'
  | 'check-circle'
  | 'phone'
  | 'type'
  | 'drag'
  | 'search'
  | 'copy'
  | 'trash'
  | 'compass'
  | 'wifi-off'
  | 'edit'
  | 'layers'
  | 'mic'
  | 'x';

interface Props {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
  className?: string;
}

export function Icon({
  name,
  size = 16,
  stroke = 1.8,
  color = 'currentColor',
  className,
}: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style: { flex: 'none', display: 'inline-block' },
  };
  switch (name) {
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'map-pin':
      return (
        <svg {...common}>
          <path d="M20 10c0 7-8 13-8 13S4 17 4 10a8 8 0 1116 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'route':
      return (
        <svg {...common}>
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="5" r="3" />
          <path d="M6 16V8a5 5 0 015-5h1M18 8v8a5 5 0 01-5 5h-1" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case 'type':
      return (
        <svg {...common}>
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
      );
    case 'drag':
      return (
        <svg {...common}>
          <circle cx="9" cy="6" r="1" fill={color} />
          <circle cx="9" cy="12" r="1" fill={color} />
          <circle cx="9" cy="18" r="1" fill={color} />
          <circle cx="15" cy="6" r="1" fill={color} />
          <circle cx="15" cy="12" r="1" fill={color} />
          <circle cx="15" cy="18" r="1" fill={color} />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6" />
        </svg>
      );
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
        </svg>
      );
    case 'wifi-off':
      return (
        <svg {...common}>
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...common}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...common}>
          <rect x="9" y="2" width="6" height="13" rx="3" />
          <path d="M5 11a7 7 0 0014 0M12 18v4M8 22h8" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
  }
}
