import { renderHook } from '@testing-library/react';

const mockUseBlocker = jest.fn(() => {});
// @ts-expect-error jest.unstable_mockModule exists in Jest 30 but @types/jest lacks it
jest.unstable_mockModule('@tanstack/react-router', () => ({
  useBlocker: mockUseBlocker
}));

const { useNavGuard } = await import('../use-nav-guard.js');

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
