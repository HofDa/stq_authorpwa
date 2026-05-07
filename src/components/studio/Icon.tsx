export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'plus'
  | 'map-pin'
  | 'camera'
  | 'route'
  | 'grid'
  | 'upload'
  | 'download'
  | 'check'
  | 'sparkles'
  | 'wand'
  | 'puzzle'
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
  | 'book-open'
  | 'hand'
  | 'flag'
  | 'mic'
  | 'x'
  | 'pen'
  | 'image'
  | 'clock'
  | 'settings';

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
    case 'upload':
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
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
    case 'wand':
      return (
        <svg {...common}>
          <path d="M15 4l5 5M14 10l-9 9-2-2 9-9" />
          <path d="M5 4v2M4 5h2M19 14v2M18 15h2M10 2v2M9 3h2" />
        </svg>
      );
    case 'puzzle':
      return (
        <svg {...common}>
          <path d="M8 3h4v3a2 2 0 104 0V3h4v6h-3a2 2 0 100 4h3v6h-6v-3a2 2 0 10-4 0v3H4v-6h3a2 2 0 100-4H4V3h4z" />
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
    case 'book-open':
      return (
        <svg {...common}>
          <path d="M2 5.5A3.5 3.5 0 015.5 2H12v18H5.5A3.5 3.5 0 002 23V5.5z" />
          <path d="M22 5.5A3.5 3.5 0 0018.5 2H12v18h6.5A3.5 3.5 0 0122 23V5.5z" />
        </svg>
      );
    case 'hand':
      return (
        <svg {...common}>
          <path d="M7 11V5.5a1.5 1.5 0 013 0V11" />
          <path d="M10 10V4.5a1.5 1.5 0 013 0V11" />
          <path d="M13 10V6.5a1.5 1.5 0 013 0V12" />
          <path d="M16 11.5V9a1.5 1.5 0 013 0v4.5a6.5 6.5 0 01-6.5 6.5H11a6 6 0 01-4.8-2.4L4 14.5a1.6 1.6 0 012.5-2l1.5 1.8" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 22V4" />
          <path d="M5 4h11l-1.5 4L16 12H5" />
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
    case 'pen':
      return (
        <svg {...common}>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
  }
}
