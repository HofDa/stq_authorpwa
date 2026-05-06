import { useCallback, useState } from 'react';

/**
 * Counter-based "fire a one-shot event from a parent" primitive.
 *
 * Returns `[signal, trigger]`. Each call to `trigger()` increments `signal`,
 * which children can pass to a `useEffect` dep array (or compare with a
 * stored value) to re-run a side effect on demand. Useful for things like
 * "focus this input again" or "open the file picker" without lifting an
 * action handler back up through props.
 */
export function useSignal(): readonly [number, () => void] {
  const [signal, setSignal] = useState(0);
  const trigger = useCallback(() => setSignal((value) => value + 1), []);
  return [signal, trigger];
}
