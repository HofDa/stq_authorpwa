export const STATION_ICON_KEYS = [
  'flag',
  'camera',
  'lock',
  'cake',
  'leaf',
  'cup',
  'star',
  'compass',
  'map',
  'mountain',
  'tree',
  'flower',
  'sun',
  'moon',
  'music',
  'book',
  'info',
  'heart',
  'gem',
  'bell',
  'key',
  'church',
  'castle',
  'bridge',
  'wine',
  'bike',
  'train',
  'bus',
  'waves',
  'paw',
  'binoculars',
] as const;

export type StationIconKey = (typeof STATION_ICON_KEYS)[number];

export const STATION_COLOR_KEYS = [
  'claret',
  'pine',
  'azure',
  'amber',
] as const;

export type StationColorKey = (typeof STATION_COLOR_KEYS)[number];

export interface StationVisualChoice {
  iconKey: StationIconKey;
  iconColorKey: StationColorKey;
}

export interface StationColorOption {
  key: StationColorKey;
  label: string;
  fill: string;
  stroke: string;
  soft: string;
  ring: string;
}

export interface StationIconOption {
  key: StationIconKey;
  label: string;
}

export interface StationVisualRecordLike {
  id: string;
  iconPath: string;
  markerIconPath: string;
  iconKey?: string;
  iconColorKey?: string;
}

export const STATION_COLOR_OPTIONS: readonly StationColorOption[] = [
  {
    key: 'claret',
    label: 'History',
    fill: '#E4008A',
    stroke: '#B00068',
    soft: '#FCE4F2',
    ring: '#A44F4A',
  },
  {
    key: 'pine',
    label: 'Nature',
    fill: '#3E9475',
    stroke: '#2D7159',
    soft: '#E7F5EE',
    ring: '#3E9475',
  },
  {
    key: 'azure',
    label: 'Sci-Fi',
    fill: '#4C72D9',
    stroke: '#3655A8',
    soft: '#E9EEFF',
    ring: '#4C72D9',
  },
  {
    key: 'amber',
    label: 'Families',
    fill: '#E2A23A',
    stroke: '#B57B1E',
    soft: '#FCF1DF',
    ring: '#E2A23A',
  },
] as const;

export const STATION_ICON_OPTIONS: readonly StationIconOption[] = [
  { key: 'flag', label: 'Flag' },
  { key: 'camera', label: 'Camera' },
  { key: 'lock', label: 'Lock' },
  { key: 'cake', label: 'Cake' },
  { key: 'leaf', label: 'Leaf' },
  { key: 'cup', label: 'Cup' },
  { key: 'star', label: 'Star' },
  { key: 'compass', label: 'Compass' },
  { key: 'map', label: 'Map' },
  { key: 'mountain', label: 'Mountain' },
  { key: 'tree', label: 'Tree' },
  { key: 'flower', label: 'Flower' },
  { key: 'sun', label: 'Sun' },
  { key: 'moon', label: 'Moon' },
  { key: 'music', label: 'Music' },
  { key: 'book', label: 'Book' },
  { key: 'info', label: 'Info' },
  { key: 'heart', label: 'Heart' },
  { key: 'gem', label: 'Gem' },
  { key: 'bell', label: 'Bell' },
  { key: 'key', label: 'Key' },
  { key: 'church', label: 'Church' },
  { key: 'castle', label: 'Castle' },
  { key: 'bridge', label: 'Bridge' },
  { key: 'wine', label: 'Wine' },
  { key: 'bike', label: 'Bike' },
  { key: 'train', label: 'Train' },
  { key: 'bus', label: 'Bus' },
  { key: 'waves', label: 'Waves' },
  { key: 'paw', label: 'Paw' },
  { key: 'binoculars', label: 'Binoculars' },
] as const;

export const DEFAULT_STATION_VISUAL: StationVisualChoice = {
  iconKey: 'flag',
  iconColorKey: 'claret',
};

const FALLBACK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

export function isStationIconKey(value: unknown): value is StationIconKey {
  return (
    typeof value === 'string' &&
    (STATION_ICON_KEYS as readonly string[]).includes(value)
  );
}

export function isStationColorKey(value: unknown): value is StationColorKey {
  return (
    typeof value === 'string' &&
    (STATION_COLOR_KEYS as readonly string[]).includes(value)
  );
}

export function getStationColorOption(key: StationColorKey) {
  return (
    STATION_COLOR_OPTIONS.find((option) => option.key === key) ??
    STATION_COLOR_OPTIONS[0]
  );
}

export function buildDraftStationAssetPaths(stationId: string) {
  return {
    iconPath: `icons/${stationId}.png`,
    markerIconPath: `markers/${stationId}.png`,
  };
}

export function buildExportStationAssetPaths(slug: string, stationId: string) {
  return {
    iconPath: `${slug}/icons/${stationId}.png`,
    markerIconPath: `${slug}/markers/${stationId}.png`,
  };
}

export function applyStationVisualSelection(
  stationId: string,
  choice: StationVisualChoice,
) {
  return {
    ...buildDraftStationAssetPaths(stationId),
    iconKey: choice.iconKey,
    iconColorKey: choice.iconColorKey,
  };
}

export function normalizeStationVisualChoice(
  record: Pick<StationVisualRecordLike, 'iconKey' | 'iconColorKey'>,
): StationVisualChoice {
  return {
    iconKey: isStationIconKey(record.iconKey)
      ? record.iconKey
      : DEFAULT_STATION_VISUAL.iconKey,
    iconColorKey: isStationColorKey(record.iconColorKey)
      ? record.iconColorKey
      : DEFAULT_STATION_VISUAL.iconColorKey,
  };
}

export function ensureStationVisualDefaults<T extends StationVisualRecordLike>(
  station: T,
): T {
  if (station.iconPath && station.markerIconPath) {
    return station;
  }

  const paths = buildDraftStationAssetPaths(station.id);
  const choice = normalizeStationVisualChoice(station);
  return {
    ...station,
    iconPath: station.iconPath || paths.iconPath,
    markerIconPath: station.markerIconPath || paths.markerIconPath,
    iconKey: station.iconKey ?? choice.iconKey,
    iconColorKey: station.iconColorKey ?? choice.iconColorKey,
  };
}

export function shouldGenerateStationVisualAssets(
  station: Pick<
    StationVisualRecordLike,
    'iconPath' | 'markerIconPath' | 'iconKey' | 'iconColorKey'
  >,
) {
  return (
    isStationIconKey(station.iconKey) ||
    isStationColorKey(station.iconColorKey) ||
    !station.iconPath ||
    !station.markerIconPath
  );
}

export function buildStationIconSvg(choice: StationVisualChoice) {
  const ink = stationIconInk();
  return [
    svgOpen(48, 48),
    `<g transform="translate(12 12)">${glyphSvg(choice.iconKey, ink, 1.9)}</g>`,
    '</svg>',
  ].join('');
}

export function buildStationMarkerSvg(
  choice: StationVisualChoice,
  options?: { highlighted?: boolean },
) {
  const color = getStationColorOption(choice.iconColorKey);
  const highlighted = options?.highlighted ?? false;
  return [
    svgOpen(63, 96),
    highlighted
      ? `<ellipse cx="31.5" cy="29" rx="25" ry="25" fill="${color.soft}" />`
      : '',
    `<path d="M31.5 5.5C19.2 5.5 9.2 15.7 9.2 28.2c0 16.6 16.9 35.9 21.1 40.5.6.7 1.7.7 2.3 0 4.2-4.6 21.1-23.9 21.1-40.5 0-12.5-10-22.7-22.2-22.7z" fill="${color.fill}" />`,
    `<circle cx="31.5" cy="29.5" r="14.2" fill="#FFFFFF" />`,
    `<g transform="translate(19.5 17.5)">${glyphSvg(choice.iconKey, color.fill, 2)}</g>`,
    '</svg>',
  ].join('');
}

export function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function renderStationVisualPngs(
  choice: StationVisualChoice,
): Promise<{ iconBlob: Blob; markerBlob: Blob }> {
  const [iconBlob, markerBlob] = await Promise.all([
    renderSvgAsPngBlob(buildStationIconSvg(choice), 48, 48),
    renderSvgAsPngBlob(buildStationMarkerSvg(choice), 63, 96),
  ]);

  return { iconBlob, markerBlob };
}

function svgOpen(width: number, height: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`;
}

function stationIconInk() {
  return '#635A57';
}

function glyphSvg(iconKey: StationIconKey, stroke: string, strokeWidth: number) {
  const base = `fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;

  switch (iconKey) {
    case 'flag':
      return [
        `<path ${base} d="M6 20V4.5" />`,
        `<path ${base} d="M6 5.5h11l-2.8 4 2.8 4H6" />`,
      ].join('');
    case 'camera':
      return [
        `<path ${base} d="M3 8.5a2 2 0 0 1 2-2h3.2l1.7-2.5h4.2l1.7 2.5H19a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />`,
        `<circle ${base} cx="12" cy="13" r="3.5" />`,
      ].join('');
    case 'lock':
      return [
        `<rect ${base} x="6.5" y="11" width="11" height="8.5" rx="2" />`,
        `<path ${base} d="M9 11V8.7a3 3 0 1 1 6 0V11" />`,
      ].join('');
    case 'cake':
      return [
        `<path ${base} d="M4 11.5h16v7.5H4z" />`,
        `<path ${base} d="M12 4.5c0 1-1.1 1.6-1.1 2.8 0 0.9 0.5 1.4 1.1 2 0.6-0.6 1.1-1.1 1.1-2 0-1.2-1.1-1.8-1.1-2.8z" />`,
        `<path ${base} d="M4 11.5c1.2 0 1.2 1.3 2.4 1.3s1.2-1.3 2.4-1.3 1.2 1.3 2.4 1.3 1.2-1.3 2.4-1.3 1.2 1.3 2.4 1.3 1.2-1.3 2.4-1.3" />`,
      ].join('');
    case 'leaf':
      return [
        `<path ${base} d="M18.5 5.5C11 5.5 5 11 5 18.5c6.9 0 13.5-5.9 13.5-13z" />`,
        `<path ${base} d="M7.5 16.5c2.6-1.2 5.8-3.5 8.7-6.9" />`,
      ].join('');
    case 'cup':
      return [
        `<path ${base} d="M5 8h10v5.2A4.8 4.8 0 0 1 10.2 18H9.8A4.8 4.8 0 0 1 5 13.2z" />`,
        `<path ${base} d="M15 9h1.5a2.8 2.8 0 0 1 0 5.6H15" />`,
        `<path ${base} d="M7 4.5h6" />`,
      ].join('');
    case 'star':
      return `<path ${base} d="m12 4.4 2.2 4.7 5.2.8-3.8 3.7.9 5.2L12 16.5l-4.5 2.3.9-5.2-3.8-3.7 5.2-.8z" />`;
    case 'compass':
      return [
        `<circle ${base} cx="12" cy="12" r="8" />`,
        `<path ${base} d="m14.9 9.1-1.9 5.8-5.8 1.9 1.9-5.8z" />`,
      ].join('');
    case 'map':
      return [
        `<path ${base} d="M4.5 6.5 9 4l6 2.5L19.5 4v13.5L15 20l-6-2.5L4.5 20z" />`,
        `<path ${base} d="M9 4v13.5M15 6.5V20" />`,
      ].join('');
    case 'mountain':
      return [
        `<path ${base} d="m3.5 19 6.8-10 3 4.5L15.8 10 20.5 19z" />`,
        `<path ${base} d="m9.8 9 1.6 2.3L13 9.2" />`,
      ].join('');
    case 'tree':
      return [
        `<path ${base} d="M12 19v-4.5" />`,
        `<path ${base} d="m12 4.5 5 5H7z" />`,
        `<path ${base} d="m12 8 6 6H6z" />`,
      ].join('');
    case 'flower':
      return [
        `<circle ${base} cx="12" cy="12" r="1.9" />`,
        `<circle ${base} cx="12" cy="7.3" r="2.1" />`,
        `<circle ${base} cx="16.1" cy="10" r="2.1" />`,
        `<circle ${base} cx="14.7" cy="15.1" r="2.1" />`,
        `<circle ${base} cx="9.3" cy="15.1" r="2.1" />`,
        `<circle ${base} cx="7.9" cy="10" r="2.1" />`,
      ].join('');
    case 'sun':
      return [
        `<circle ${base} cx="12" cy="12" r="3.5" />`,
        `<path ${base} d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />`,
      ].join('');
    case 'moon':
      return `<path ${base} d="M15.8 4.8a7.7 7.7 0 1 0 3.4 13.7A8.8 8.8 0 0 1 15.8 4.8z" />`;
    case 'music':
      return [
        `<path ${base} d="M14.5 5.5v9.2" />`,
        `<path ${base} d="M14.5 5.5 19 7v8.4" />`,
        `<circle ${base} cx="10" cy="16.8" r="2.2" />`,
        `<circle ${base} cx="19" cy="15.8" r="2.2" />`,
      ].join('');
    case 'book':
      return [
        `<path ${base} d="M5.5 5.5h5.7a2.3 2.3 0 0 1 2.3 2.3V19H7.8a2.3 2.3 0 0 0-2.3 2.3z" />`,
        `<path ${base} d="M18.5 5.5h-5.7a2.3 2.3 0 0 0-2.3 2.3V19h5.7a2.3 2.3 0 0 1 2.3 2.3z" />`,
      ].join('');
    case 'info':
      return [
        `<circle ${base} cx="12" cy="12" r="8" />`,
        `<path ${base} d="M12 10.5v5" />`,
        `<path ${base} d="M12 7.5h.01" />`,
      ].join('');
    case 'heart':
      return `<path ${base} d="M12 19s-6.5-3.9-6.5-8.5a3.6 3.6 0 0 1 6.5-2.2 3.6 3.6 0 0 1 6.5 2.2C18.5 15.1 12 19 12 19z" />`;
    case 'gem':
      return [
        `<path ${base} d="M7 6.5h10l3 4-8 8-8-8z" />`,
        `<path ${base} d="m9 6.5 3 4 3-4M4 10.5h16" />`,
      ].join('');
    case 'bell':
      return [
        `<path ${base} d="M8 17.5h8" />`,
        `<path ${base} d="M9 17.5V10a3 3 0 1 1 6 0v7.5" />`,
        `<path ${base} d="M7 17.5h10l-1.2 2H8.2z" />`,
      ].join('');
    case 'key':
      return [
        `<circle ${base} cx="8.5" cy="12" r="3" />`,
        `<path ${base} d="M11.5 12H20" />`,
        `<path ${base} d="M16.5 12v2.5M18.8 12v1.8" />`,
      ].join('');
    case 'church':
      return [
        `<path ${base} d="M6.5 19V10.5L12 6l5.5 4.5V19z" />`,
        `<path ${base} d="M10 19v-4.2h4V19M12 6V3.8M10.7 4.9h2.6" />`,
      ].join('');
    case 'castle':
      return [
        `<path ${base} d="M5 19V8h3v2h2V8h4v2h2V8h3v11" />`,
        `<path ${base} d="M9.5 19v-4h5v4M5 19h14" />`,
      ].join('');
    case 'bridge':
      return [
        `<path ${base} d="M4.5 18.5h15" />`,
        `<path ${base} d="M7 18.5v-4.8a5 5 0 0 1 10 0v4.8" />`,
        `<path ${base} d="M10.5 18.5v-5M13.5 18.5v-5" />`,
      ].join('');
    case 'wine':
      return [
        `<path ${base} d="M8 4.5h8v2.3a4 4 0 0 1-8 0z" />`,
        `<path ${base} d="M12 10.8V19M9.5 19h5" />`,
      ].join('');
    case 'bike':
      return [
        `<circle ${base} cx="7.2" cy="16.5" r="2.8" />`,
        `<circle ${base} cx="16.8" cy="16.5" r="2.8" />`,
        `<path ${base} d="M7.2 16.5 10 10h3.8l3 6.5M9.4 10H6.8M13.2 10l1.4-2.5h2.2" />`,
      ].join('');
    case 'train':
      return [
        `<rect ${base} x="6" y="5.5" width="12" height="11" rx="2" />`,
        `<path ${base} d="M9 9.2h2.2M12.8 9.2H15M8 19l1.8-2.5M16 19l-1.8-2.5M6 14.5h12" />`,
      ].join('');
    case 'bus':
      return [
        `<rect ${base} x="5.5" y="6" width="13" height="10.5" rx="2" />`,
        `<path ${base} d="M8.2 9.2h7.6M7.5 18.5l1.2-2M16.5 18.5l-1.2-2" />`,
        `<circle ${base} cx="8.6" cy="16.8" r="1.2" />`,
        `<circle ${base} cx="15.4" cy="16.8" r="1.2" />`,
      ].join('');
    case 'waves':
      return [
        `<path ${base} d="M4.5 9.5c1.4 0 1.4 1 2.8 1s1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1" />`,
        `<path ${base} d="M4.5 13c1.4 0 1.4 1 2.8 1s1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1" />`,
        `<path ${base} d="M4.5 16.5c1.4 0 1.4 1 2.8 1s1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1" />`,
      ].join('');
    case 'paw':
      return [
        `<circle ${base} cx="8" cy="9" r="1.8" />`,
        `<circle ${base} cx="12" cy="7" r="1.8" />`,
        `<circle ${base} cx="16" cy="9" r="1.8" />`,
        `<path ${base} d="M8.2 16.8c0-2.2 1.7-4 3.8-4s3.8 1.8 3.8 4c0 1.2-.8 2.2-2 2.2H10.2c-1.2 0-2-.9-2-2.2z" />`,
      ].join('');
    case 'binoculars':
      return [
        `<path ${base} d="M8.5 7.5 7 12M15.5 7.5 17 12" />`,
        `<circle ${base} cx="7.2" cy="15.5" r="3.2" />`,
        `<circle ${base} cx="16.8" cy="15.5" r="3.2" />`,
        `<path ${base} d="M10.2 8.5h3.6v3.2h-3.6z" />`,
      ].join('');
  }
}

async function renderSvgAsPngBlob(
  svg: string,
  width: number,
  height: number,
): Promise<Blob> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return fallbackPngBlob();
  }

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=UTF-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return fallbackPngBlob();
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), 'image/png');
    });

    return blob ?? fallbackPngBlob();
  } catch {
    return fallbackPngBlob();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode station visual'));
    image.src = url;
  });
}

function fallbackPngBlob() {
  const bytes =
    typeof Buffer !== 'undefined'
      ? Uint8Array.from(Buffer.from(FALLBACK_PNG_BASE64, 'base64'))
      : Uint8Array.from(atob(FALLBACK_PNG_BASE64), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: 'image/png' });
}
