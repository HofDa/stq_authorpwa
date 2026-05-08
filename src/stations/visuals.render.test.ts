import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderStationVisualPngs } from './visuals.render';
import { DEFAULT_STATION_VISUAL } from './visuals.logic';

// Mock the global DOM APIs for testing fallback behavior
const mockImage = vi.fn();
const mockCreateElement = vi.fn();
const mockGetContext = vi.fn();
const mockToBlob = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

const originalDocument = global.document;
const originalImage = global.Image;
const originalURL = global.URL;

const FALLBACK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';
const expectedFallbackBlob = new Blob(
  [
    typeof Buffer !== 'undefined'
      ? Uint8Array.from(Buffer.from(FALLBACK_PNG_BASE64, 'base64'))
      : Uint8Array.from(atob(FALLBACK_PNG_BASE64), (char) =>
          char.charCodeAt(0),
        ),
  ],
  { type: 'image/png' },
);

describe('visuals.render', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default successful mocks for browser environment
    global.document = {
      createElement: mockCreateElement,
    } as unknown as Document;
    global.Image = mockImage as unknown as typeof Image;
    global.URL = {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    } as unknown as typeof URL;

    mockCreateElement.mockReturnValue({
      getContext: mockGetContext,
      toBlob: mockToBlob,
      width: 0,
      height: 0,
    });
    mockGetContext.mockReturnValue({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    });
    mockCreateObjectURL.mockReturnValue('blob:http://mock-url');
    mockImage.mockImplementation(() => {
      const image = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        _src: '',
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onload?.(new Event('load')), 0);
        },
        get src() {
          return this._src;
        },
      };
      return image;
    });
  });

  afterEach(() => {
    // Restore original globals after each test
    global.document = originalDocument;
    global.Image = originalImage;
    global.URL = originalURL;
  });

  it('returns fallback blobs in a non-browser environment', async () => {
    global.document = undefined as unknown as Document;
    global.Image = undefined as unknown as typeof Image;

    const { iconBlob, markerBlob } = await renderStationVisualPngs(
      DEFAULT_STATION_VISUAL,
    );

    expect(iconBlob.size).toBe(expectedFallbackBlob.size);
    expect(iconBlob.type).toBe('image/png');
    expect(markerBlob.size).toBe(expectedFallbackBlob.size);
    expect(markerBlob.type).toBe('image/png');
    expect(mockCreateElement).not.toHaveBeenCalled();
  });

  it('returns fallback blobs if image loading fails', async () => {
    mockImage.mockImplementation(() => {
      const image = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        _src: '',
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onerror?.(new Event('error')), 0);
        },
        get src() {
          return this._src;
        },
      };
      return image;
    });

    const { iconBlob, markerBlob } = await renderStationVisualPngs(
      DEFAULT_STATION_VISUAL,
    );

    expect(iconBlob.size).toBe(expectedFallbackBlob.size);
    expect(markerBlob.size).toBe(expectedFallbackBlob.size);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://mock-url');
  });

  it('returns fallback blobs if canvas context is unavailable', async () => {
    mockGetContext.mockReturnValue(null); // Simulate no 2D context

    const { iconBlob, markerBlob } = await renderStationVisualPngs(
      DEFAULT_STATION_VISUAL,
    );

    expect(iconBlob.size).toBe(expectedFallbackBlob.size);
    expect(markerBlob.size).toBe(expectedFallbackBlob.size);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://mock-url');
  });

  it('returns fallback blobs if canvas.toBlob fails', async () => {
    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(null); // Simulate toBlob failure
    });

    const { iconBlob, markerBlob } = await renderStationVisualPngs(
      DEFAULT_STATION_VISUAL,
    );

    expect(iconBlob.size).toBe(expectedFallbackBlob.size);
    expect(markerBlob.size).toBe(expectedFallbackBlob.size);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://mock-url');
  });

  it('does not throw uncaught errors on rendering failure', async () => {
    global.document = undefined as unknown as Document; // Non-browser environment

    // Expect the function to resolve, not throw
    await expect(
      renderStationVisualPngs(DEFAULT_STATION_VISUAL),
    ).resolves.toBeDefined();
  });

  it('revokes object URL even on failure', async () => {
    mockImage.mockImplementation(() => {
      const image = {
        onload: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        _src: '',
        set src(value: string) {
          this._src = value;
          setTimeout(() => this.onerror?.(new Event('error')), 0);
        },
        get src() {
          return this._src;
        },
      };
      return image;
    });

    await renderStationVisualPngs(DEFAULT_STATION_VISUAL);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://mock-url');
  });
});
