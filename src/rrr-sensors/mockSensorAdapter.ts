import type { RrrSensorAdapter, RrrSensorState } from './types';

export type RrrSensorStatePatch = Partial<Omit<RrrSensorState, 'timestamp'>> & {
  timestamp?: number;
};

export interface RrrMockSensorAdapter extends RrrSensorAdapter {
  emit(state: RrrSensorState): void;
  patchState(patch: RrrSensorStatePatch): RrrSensorState;
}

export interface RrrMockSensorAdapterOptions {
  initialState?: RrrSensorStatePatch;
  now?: () => number;
}

export function createMockSensorAdapter(
  options: RrrMockSensorAdapterOptions = {},
): RrrMockSensorAdapter {
  return new MockSensorAdapter(options);
}

export function createNoopSensorAdapter(
  initialState: RrrSensorState = { timestamp: 0 },
): RrrSensorAdapter {
  return createMockSensorAdapter({ initialState });
}

class MockSensorAdapter implements RrrMockSensorAdapter {
  private readonly listeners = new Set<(state: RrrSensorState) => void>();
  private readonly now: () => number;
  private state: RrrSensorState;

  constructor({ initialState = {}, now = Date.now }: RrrMockSensorAdapterOptions) {
    this.now = now;
    this.state = {
      ...initialState,
      timestamp: initialState.timestamp ?? now(),
    };
  }

  async start(): Promise<void> {
    return undefined;
  }

  stop(): void {}

  getState(): RrrSensorState {
    return { ...this.state };
  }

  subscribe(listener: (state: RrrSensorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(state: RrrSensorState): void {
    this.state = { ...state };
    this.notify();
  }

  patchState(patch: RrrSensorStatePatch): RrrSensorState {
    this.state = {
      ...this.state,
      ...patch,
      timestamp: patch.timestamp ?? this.now(),
    };
    this.notify();
    return this.getState();
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
