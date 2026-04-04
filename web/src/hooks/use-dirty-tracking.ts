import { useCallback, useMemo, useRef, useState } from 'react';

type DirtyTracking<T extends Record<string, unknown>> = {
  current: T;
  isDirty: boolean;
  dirtyCount: number;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  isDirtyField: (key: keyof T) => boolean;
  reset: () => void;
  getChanges: () => Partial<T>;
};

function useDirtyTracking<T extends Record<string, unknown>>(savedState: T): DirtyTracking<T> {
  const [current, setCurrent] = useState<T>(savedState);
  const savedRef = useRef(savedState);

  // Update baseline when savedState changes (e.g., after successful save)
  if (savedRef.current !== savedState) {
    savedRef.current = savedState;
    setCurrent(savedState);
  }

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setCurrent(prev => ({ ...prev, [key]: value }));
  }, []);

  const isDirtyField = useCallback((key: keyof T): boolean => current[key] !== savedRef.current[key], [current]);

  const reset = useCallback(() => {
    setCurrent(savedRef.current);
  }, []);

  const getChanges = useCallback((): Partial<T> => {
    const changes: Partial<T> = {};
    for (const key of Object.keys(savedRef.current) as Array<keyof T>) {
      if (current[key] !== savedRef.current[key]) {
        changes[key] = current[key];
      }
    }
    return changes;
  }, [current]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(savedRef.current) as Array<keyof T>) {
      if (current[key] !== savedRef.current[key]) count++;
    }
    return count;
  }, [current]);

  return {
    current,
    isDirty: dirtyCount > 0,
    dirtyCount,
    setField,
    isDirtyField,
    reset,
    getChanges
  };
}

export type { DirtyTracking };
export { useDirtyTracking };
