/** @vitest-environment happy-dom */
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QrScanner } from './QrScanner';

const zxingMock = vi.hoisted(() => ({
  decodeFromConstraints: vi.fn(),
}));

vi.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: vi.fn(() => ({
    decodeFromConstraints: zxingMock.decodeFromConstraints,
  })),
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root | null;
let originalMediaDevices: MediaDevices | undefined;
type MockScannerControls = { stop: ReturnType<typeof vi.fn> };

beforeEach(() => {
  zxingMock.decodeFromConstraints.mockReset();
  originalMediaDevices = navigator.mediaDevices;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn() },
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
    root = null;
  }
  container.remove();
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: originalMediaDevices,
  });
});

describe('QrScanner', () => {
  it('starts camera scanning only after explicit user action', async () => {
    const controls = { stop: vi.fn() };
    zxingMock.decodeFromConstraints.mockResolvedValue(controls);

    render(<QrScanner onScan={() => {}} />);

    expect(container.textContent).toContain('Kamera wird benötigt');
    expect(zxingMock.decodeFromConstraints).not.toHaveBeenCalled();

    await clickButton('Kamera aktivieren');

    expect(zxingMock.decodeFromConstraints).toHaveBeenCalledTimes(1);
    expect(zxingMock.decodeFromConstraints.mock.calls[0][0]).toMatchObject({
      video: { facingMode: { ideal: 'environment' } },
    });
  });

  it('passes a decoded QR value to runtime input and stops scanning', async () => {
    const onScan = vi.fn();
    const controls: MockScannerControls = { stop: vi.fn() };
    let scanCallback:
      | ((
          result: { getText: () => string },
          error: Error | undefined,
          controls: MockScannerControls,
        ) => void)
      | undefined;
    zxingMock.decodeFromConstraints.mockImplementation(
      async (_constraints, _video, callback) => {
        scanCallback = callback;
        return controls;
      },
    );

    render(<QrScanner fallbackAvailable onScan={onScan} />);
    await clickButton('Kamera aktivieren');

    act(() => {
      scanCallback?.({ getText: () => ' station-3-gate ' }, undefined, controls);
    });

    expect(onScan).toHaveBeenCalledWith('station-3-gate');
    expect(controls.stop).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('QR-Code wurde gelesen');
    expect(container.textContent).toContain('Ersatzlösung verwenden');
  });

  it('shows a friendly denied state when permission is rejected', async () => {
    zxingMock.decodeFromConstraints.mockRejectedValue({
      name: 'NotAllowedError',
    });

    render(<QrScanner onScan={() => {}} />);
    await clickButton('Kamera aktivieren');

    expect(container.textContent).toContain('Kamera wurde nicht freigegeben');
    expect(container.textContent).toContain('Kamerafreigabe wurde abgelehnt');
  });

  it('shows unavailable state without a camera API', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });

    render(<QrScanner onScan={() => {}} />);
    await clickButton('Kamera aktivieren');

    expect(zxingMock.decodeFromConstraints).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Kamera nicht verfügbar');
  });

  it('reports status transitions to the owner', async () => {
    const onStatusChange = vi.fn();
    const controls = { stop: vi.fn() };
    zxingMock.decodeFromConstraints.mockResolvedValue(controls);

    render(<QrScanner onScan={() => {}} onStatusChange={onStatusChange} />);
    await clickButton('Kamera aktivieren');

    expect(onStatusChange.mock.calls.map(([status]) => status)).toEqual([
      'idle',
      'requesting',
      'scanning',
    ]);
  });

  it('stops scanner controls on unmount', async () => {
    const controls = { stop: vi.fn() };
    zxingMock.decodeFromConstraints.mockResolvedValue(controls);

    render(<QrScanner onScan={() => {}} />);
    await clickButton('Kamera aktivieren');

    act(() => {
      root?.unmount();
    });
    root = null;

    expect(controls.stop).toHaveBeenCalledTimes(1);
  });
});

function render(element: ReactElement) {
  act(() => {
    root?.render(element);
  });
}

async function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.includes(label),
  );
  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}
