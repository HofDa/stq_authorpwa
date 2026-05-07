import { useEffect, useMemo, useState } from 'react';
import { createRrrRuntimeBridge } from './createRrrRuntimeBridge';
import type {
  RrrRuntimeBridge,
  RrrRuntimeBridgeOptions,
  RrrRuntimeBridgeSnapshot,
  RrrRuntimeUserInput,
} from './types';

export function useRrrRuntimeBridge(
  options: RrrRuntimeBridgeOptions,
): {
  bridge: RrrRuntimeBridge;
  snapshot: RrrRuntimeBridgeSnapshot;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  retry: (
    moduleId?: string,
    options?: {
      resetProgress?: boolean;
    },
  ) => void;
  setUserInput: (userInput: RrrRuntimeUserInput) => void;
} {
  const bridge = useMemo(() => createRrrRuntimeBridge(options), [options]);
  const [snapshot, setSnapshot] = useState(() => bridge.getSnapshot());

  useEffect(() => {
    setSnapshot(bridge.getSnapshot());
    return bridge.subscribe(setSnapshot);
  }, [bridge]);

  useEffect(() => {
    return () => bridge.dispose();
  }, [bridge]);

  return {
    bridge,
    snapshot,
    start: bridge.start,
    stop: bridge.stop,
    reset: bridge.reset,
    retry: bridge.retry,
    setUserInput: bridge.setUserInput,
  };
}
