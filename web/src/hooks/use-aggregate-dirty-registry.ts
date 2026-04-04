import { useCallback, useRef, useSyncExternalStore } from 'react';

interface AggregateDirtyRegistry {
  register: (id: string, isDirty: boolean) => void;
  isDirty: boolean;
}

function useAggregateDirtyRegistry(): AggregateDirtyRegistry {
  const dirtyIds = useRef(new Set<string>());
  const listeners = useRef(new Set<() => void>());

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  const getSnapshot = useCallback(() => dirtyIds.current.size > 0, []);

  const isDirty = useSyncExternalStore(subscribe, getSnapshot);

  const register = useCallback((id: string, dirty: boolean) => {
    const prev = dirtyIds.current.has(id);
    if (dirty && !prev) {
      dirtyIds.current.add(id);
      for (const listener of listeners.current) listener();
    } else if (!dirty && prev) {
      dirtyIds.current.delete(id);
      for (const listener of listeners.current) listener();
    }
  }, []);

  return { register, isDirty };
}

export { useAggregateDirtyRegistry };
