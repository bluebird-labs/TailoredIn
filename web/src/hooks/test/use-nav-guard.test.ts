import { describe, expect, mock, test } from 'bun:test';
import { renderHook } from '@testing-library/react';
import { useNavGuard } from '../use-nav-guard.js';

// Mock TanStack Router's useBlocker
const mockUseBlocker = mock(() => {});
mock.module('@tanstack/react-router', () => ({
  useBlocker: mockUseBlocker
}));

describe('useNavGuard', () => {
  test('calls useBlocker with shouldBlockFn that returns isDirty value', () => {
    renderHook(() => useNavGuard({ isDirty: true }));

    expect(mockUseBlocker).toHaveBeenCalledWith(
      expect.objectContaining({
        enableBeforeUnload: expect.any(Function),
        disabled: false
      })
    );
  });

  test('disables blocker when not dirty', () => {
    renderHook(() => useNavGuard({ isDirty: false }));

    expect(mockUseBlocker).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true
      })
    );
  });
});
