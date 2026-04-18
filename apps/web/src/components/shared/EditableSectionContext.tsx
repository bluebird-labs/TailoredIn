import { createContext, type ReactNode, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

interface EditableSectionStore {
  subscribe: (listener: () => void) => () => void;
  getActiveId: () => string | null;
  requestEdit: (id: string) => boolean;
  forceEdit: (id: string) => void;
  release: (id: string) => void;
}

function createEditableSectionStore(): EditableSectionStore {
  let activeId: string | null = null;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getActiveId: () => activeId,
    requestEdit: id => {
      if (activeId !== null && activeId !== id) return false;
      if (activeId === id) return true;
      activeId = id;
      notify();
      return true;
    },
    forceEdit: id => {
      if (activeId === id) return;
      activeId = id;
      notify();
    },
    release: id => {
      if (activeId !== id) return;
      activeId = null;
      notify();
    }
  };
}

const EditableSectionContext = createContext<EditableSectionStore | null>(null);

interface EditableSectionProviderProps {
  readonly children: ReactNode;
}

function EditableSectionProvider({ children }: EditableSectionProviderProps) {
  const store = useMemo(() => createEditableSectionStore(), []);
  return <EditableSectionContext value={store}>{children}</EditableSectionContext>;
}

interface EditableSectionHook {
  isEditing: boolean;
  isBlocked: boolean;
  requestEdit: () => boolean;
  forceEdit: () => void;
  release: () => void;
}

function useEditableSection(sectionId: string): EditableSectionHook {
  const store = useContext(EditableSectionContext);
  if (!store) throw new Error('useEditableSection must be used within EditableSectionProvider');

  const activeId = useSyncExternalStore(store.subscribe, store.getActiveId);

  const requestEdit = useCallback(() => store.requestEdit(sectionId), [store, sectionId]);
  const forceEdit = useCallback(() => store.forceEdit(sectionId), [store, sectionId]);
  const release = useCallback(() => store.release(sectionId), [store, sectionId]);

  return {
    isEditing: activeId === sectionId,
    isBlocked: activeId !== null && activeId !== sectionId,
    requestEdit,
    forceEdit,
    release
  };
}

export type { EditableSectionHook };
export { EditableSectionProvider, useEditableSection };
