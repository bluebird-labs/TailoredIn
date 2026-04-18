import { useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'tailoredin-search:';

function getStoredSearch<T>(routePath: string): Partial<T> | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${routePath}`);
    return stored ? (JSON.parse(stored) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function clearStoredSearch(routePath: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${routePath}`);
  } catch {
    // Storage unavailable — silently ignore
  }
}

function setStoredSearch(routePath: string, values: Record<string, unknown>): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${routePath}`, JSON.stringify(values));
  } catch {
    // Storage unavailable — silently ignore
  }
}

/**
 * TanStack Router search middleware factory.
 * Reads persisted search params from localStorage when URL params are missing.
 * URL params always take precedence over stored values.
 */
export function persistSearchParams<T extends Record<string, unknown>>(
  routePath: string,
  keys: (keyof T & string)[]
): (ctx: { search: T; next: (s: T) => T }) => T {
  return ({ search, next }) => {
    const result = next(search);
    const stored = getStoredSearch<T>(routePath);
    if (!stored) return result;

    const merged = { ...result };
    for (const key of keys) {
      if (merged[key] === undefined && stored[key] !== undefined) {
        merged[key] = stored[key] as T[typeof key];
      }
    }
    return merged;
  };
}

/**
 * React hook that syncs current search param values to localStorage.
 * Call in route components to keep the persisted state up to date.
 */
export function useSearchPersistence<T extends Record<string, unknown>>(
  routePath: string,
  search: T,
  keys: (keyof T & string)[]
): void {
  useEffect(() => {
    const toStore: Record<string, unknown> = {};
    let hasValues = false;
    for (const key of keys) {
      if (search[key] !== undefined) {
        toStore[key] = search[key];
        hasValues = true;
      }
    }
    if (hasValues) {
      setStoredSearch(routePath, toStore);
    } else {
      try {
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${routePath}`);
      } catch {
        // Storage unavailable — silently ignore
      }
    }
  }, [routePath, search, keys]);
}
