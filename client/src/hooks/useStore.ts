import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { store } from "@/data/store";

/**
 * Hook that re-renders when the store changes.
 * 
 * Usage 1 (selector): useStore(() => store.getContainers())
 * Usage 2 (raw):      useStore() → { store, refresh }
 */
export function useStore<T>(selector: () => T): T;
export function useStore(): { store: typeof store; refresh: () => void };
export function useStore<T>(selector?: () => T) {
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick((t) => t + 1));
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  if (selector) {
    // Re-run selector on every render (tick changes trigger re-render)
    return selector();
  }

  return { store, refresh };
}
