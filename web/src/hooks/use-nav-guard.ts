import { useBlocker } from '@tanstack/react-router';

interface NavGuardOptions {
  readonly isDirty: boolean;
}

// Uses native browser confirm dialog. For a custom dialog with "Stay"/"Leave" buttons,
// switch to withResolver: true and render a ConfirmDialog from the resolved blocker state.
function useNavGuard({ isDirty }: NavGuardOptions): void {
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: () => isDirty,
    disabled: !isDirty,
    withResolver: false
  });
}

export type { NavGuardOptions };
export { useNavGuard };
