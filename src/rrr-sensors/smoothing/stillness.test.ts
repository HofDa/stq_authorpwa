import { describe, expect, it } from 'vitest';
import { updateStillnessDebounce } from './stillness';

describe('stillness debounce', () => {
  it('waits before reporting stillness', () => {
    let state = updateStillnessDebounce(undefined, false, 1000, {
      stillAfterMs: 1000,
    });

    expect(state.isStill).toBe(false);

    state = updateStillnessDebounce(state, false, 1900, {
      stillAfterMs: 1000,
    });

    expect(state.isStill).toBe(false);

    state = updateStillnessDebounce(state, false, 2100, {
      stillAfterMs: 1000,
    });

    expect(state.isStill).toBe(true);
  });

  it('uses release hysteresis to avoid one-frame flicker', () => {
    let state = updateStillnessDebounce(undefined, false, 0, {
      stillAfterMs: 0,
      releaseAfterMs: 500,
    });
    state = updateStillnessDebounce(state, false, 1, {
      stillAfterMs: 0,
      releaseAfterMs: 500,
    });

    expect(state.isStill).toBe(true);

    state = updateStillnessDebounce(state, true, 100, {
      stillAfterMs: 0,
      releaseAfterMs: 500,
    });

    expect(state.isStill).toBe(true);

    state = updateStillnessDebounce(state, true, 700, {
      stillAfterMs: 0,
      releaseAfterMs: 500,
    });

    expect(state.isStill).toBe(false);
  });
});
