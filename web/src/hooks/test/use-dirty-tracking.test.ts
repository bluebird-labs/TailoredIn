import { act, renderHook } from '@testing-library/react';
import { useDirtyTracking } from '../use-dirty-tracking.js';

// @happy-dom is configured in web/bunfig.toml

describe('useDirtyTracking', () => {
  test('starts clean with saved state as current', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
    expect(result.current.current).toEqual(saved);
  });

  test('detects dirty state when a field changes', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.dirtyCount).toBe(1);
    expect(result.current.current.name).toBe('Bob');
  });

  test('returns clean when field reverts to saved value', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setField('name', 'Alice');
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  test('reset restores current to saved state', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
      result.current.setField('title', 'Manager');
    });
    expect(result.current.dirtyCount).toBe(2);

    act(() => {
      result.current.reset();
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.current).toEqual(saved);
  });

  test('getChanges returns only modified fields', () => {
    const saved = { name: 'Alice', title: 'Engineer', location: 'NYC' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
      result.current.setField('location', 'SF');
    });

    expect(result.current.getChanges()).toEqual({ name: 'Bob', location: 'SF' });
  });

  test('isDirtyField checks individual field dirty state', () => {
    const saved = { name: 'Alice', title: 'Engineer' };
    const { result } = renderHook(() => useDirtyTracking(saved));

    act(() => {
      result.current.setField('name', 'Bob');
    });

    expect(result.current.isDirtyField('name')).toBe(true);
    expect(result.current.isDirtyField('title')).toBe(false);
  });

  test('updates saved baseline when savedState prop changes', () => {
    const initial = { name: 'Alice', title: 'Engineer' };
    const { result, rerender } = renderHook(({ saved }) => useDirtyTracking(saved), {
      initialProps: { saved: initial }
    });

    act(() => {
      result.current.setField('name', 'Bob');
    });
    expect(result.current.isDirty).toBe(true);

    // Simulate server returning updated data after save
    rerender({ saved: { name: 'Bob', title: 'Engineer' } });
    expect(result.current.isDirty).toBe(false);
  });
});
