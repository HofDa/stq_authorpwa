import {
  buildStationIconSvg,
  buildStationMarkerSvg,
  type StationVisualChoice,
} from './visuals.logic';

const FALLBACK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

export async function renderStationVisualPngs(
  choice: StationVisualChoice,
): Promise<{ iconBlob: Blob; markerBlob: Blob }> {
  const [iconBlob, markerBlob] = await Promise.all([
    renderSvgAsPngBlob(buildStationIconSvg(choice), 48, 48),
    renderSvgAsPngBlob(buildStationMarkerSvg(choice), 63, 96),
  ]);

  return { iconBlob, markerBlob };
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