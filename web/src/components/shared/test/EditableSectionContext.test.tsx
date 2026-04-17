import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EditableSectionProvider, useEditableSection } from '../EditableSectionContext.js';

function wrapper({ children }: { children: ReactNode }) {
  return <EditableSectionProvider>{children}</EditableSectionProvider>;
}

describe('useEditableSection', () => {
  test('starts with no section editing', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    expect(result.current.isEditing).toBe(false);
  });

  test('requestEdit activates the section', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    act(() => {
      result.current.requestEdit();
    });
    expect(result.current.isEditing).toBe(true);
  });

  test('release deactivates the section', () => {
    const { result } = renderHook(() => useEditableSection('section-a'), { wrapper });
    act(() => {
      result.current.requestEdit();
    });
    act(() => {
      result.current.release();
    });
    expect(result.current.isEditing).toBe(false);
  });

  test('only one section can be active at a time', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    expect(result.current.a.isEditing).toBe(true);

    // B cannot take over while A is active
    act(() => {
      result.current.b.requestEdit();
    });
    expect(result.current.b.isEditing).toBe(false);
    expect(result.current.a.isEditing).toBe(true);
  });

  test('second section can activate after first releases', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    act(() => {
      result.current.a.release();
    });
    act(() => {
      result.current.b.requestEdit();
    });
    expect(result.current.b.isEditing).toBe(true);
    expect(result.current.a.isEditing).toBe(false);
  });

  test('isBlocked is true for inactive section when another is editing', () => {
    const { result } = renderHook(() => ({ a: useEditableSection('section-a'), b: useEditableSection('section-b') }), {
      wrapper
    });
    act(() => {
      result.current.a.requestEdit();
    });
    expect(result.current.b.isBlocked).toBe(true);
    expect(result.current.a.isBlocked).toBe(false);
  });

  test('forceRelease allows taking over from another section', () => {
    const { result } = renderHook(
      () => ({
        a: useEditableSection('section-a'),
        b: useEditableSection('section-b')
      }),
      { wrapper }
    );

    act(() => {
      result.current.a.requestEdit();
    });
    act(() => {
      result.current.b.forceEdit();
    });
    expect(result.current.b.isEditing).toBe(true);
    expect(result.current.a.isEditing).toBe(false);
  });
});
