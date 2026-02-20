import { useState, useEffect, useCallback } from "react";
import { store } from "@/data/store";

/**
 * Hook that re-renders when the store changes.
 * Returns the store instance and a forceRefresh function.
 */
export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { store, refresh };
}
