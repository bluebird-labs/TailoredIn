import {
  Children,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect
} from 'react';
import { cn } from '@/lib/utils';
import { useEditableSection } from './EditableSectionContext.js';
import { SaveBar } from './SaveBar.js';

// Sub-components used as slot markers

function EditableSectionDisplay({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}

function EditableSectionEditor({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}

// Main props

interface EditableSectionProps {
  readonly sectionId: string;
  readonly variant?: 'section' | 'card';
  readonly onSave: () => void | Promise<void>;
  readonly onDiscard: () => void;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

function EditableSectionInner({
  sectionId,
  variant = 'section',
  onSave,
  onDiscard,
  isDirty,
  isSaving,
  className,
  children
}: EditableSectionProps) {
  const { isEditing, requestEdit, release } = useEditableSection(sectionId);

  // Extract display and editor slots from children
  let displayChildren: ReactNode = null;
  let editorChildren: ReactNode = null;

  Children.forEach(children, child => {
    if (isValidElement(child)) {
      if (child.type === EditableSectionDisplay) {
        displayChildren = (child as ReactElement<{ children: ReactNode }>).props.children;
      } else if (child.type === EditableSectionEditor) {
        editorChildren = (child as ReactElement<{ children: ReactNode }>).props.children;
      }
    }
  });

  const handleSave = useCallback(async () => {
    try {
      await onSave();
    } finally {
      release();
    }
  }, [onSave, release]);

  const handleDiscard = useCallback(() => {
    onDiscard();
    release();
  }, [onDiscard, release]);

  const handleDisplayClick = useCallback(() => {
    requestEdit();
  }, [requestEdit]);

  const handleDisplayKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        requestEdit();
      }
    },
    [requestEdit]
  );

  // Escape key handler — attached to document when in edit mode
  useEffect(() => {
    if (!isEditing) return;

    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !isDirty) {
        handleDiscard();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, isDirty, handleDiscard]);

  if (isEditing) {
    return (
      <div
        data-testid={`editable-section-${sectionId}`}
        className={cn(
          'border border-primary/50 rounded-[14px] p-5 transition-colors duration-200',
          variant === 'section' && 'rounded-[14px]',
          className
        )}
      >
        {editorChildren}
        <SaveBar
          variant="inline"
          dirtyCount={isDirty ? 1 : 0}
          onSave={handleSave}
          onDiscard={handleDiscard}
          isSaving={isSaving}
        />
      </div>
    );
  }

  // Display mode
  return (
    <button
      type="button"
      data-testid={`editable-section-${sectionId}`}
      onClick={handleDisplayClick}
      onKeyDown={handleDisplayKeyDown}
      className={cn(
        'w-full text-left hover:bg-accent/40 transition-colors duration-200 cursor-pointer',
        variant === 'card' && 'border border-border rounded-[14px] p-5',
        className
      )}
    >
      {displayChildren}
    </button>
  );
}

// Compound component

const EditableSection = Object.assign(EditableSectionInner, {
  Display: EditableSectionDisplay,
  Editor: EditableSectionEditor
});

export { EditableSection };
