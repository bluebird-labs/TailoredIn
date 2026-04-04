import { useBlocker } from '@tanstack/react-router';

interface NavGuardOptions {
  readonly isDirty: boolean;
  readonly message?: string;
}

function useNavGuard({
  isDirty,
  message: _message = 'You have unsaved changes. Leave without saving?'
}: NavGuardOptions): void {
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    disabled: !isDirty,
    withResolver: false
  });
}

export type { NavGuardOptions };
export { useNavGuard };
