import { act, fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EditableSection } from '../EditableSection.js';
import { EditableSectionProvider } from '../EditableSectionContext.js';

function wrapper({ children }: { readonly children: ReactNode }) {
  return <EditableSectionProvider>{children}</EditableSectionProvider>;
}

function renderInProvider(ui: ReactNode) {
  return render(ui, { wrapper });
}

describe('EditableSection', () => {
  test('renders display slot by default, not editor', () => {
    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={jest.fn()} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    expect(container.querySelector('[data-slot="display"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="editor"]')).toBeNull();
  });

  test('switches to editor on click', async () => {
    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={jest.fn()} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    const displayWrapper = container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(displayWrapper);
    });

    expect(container.querySelector('[data-slot="display"]')).toBeNull();
    expect(container.querySelector('[data-slot="editor"]')).not.toBeNull();
  });

  test('shows Save and Discard buttons in edit mode', async () => {
    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={jest.fn()} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    await act(async () => {
      fireEvent.click(container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement);
    });

    const buttons = container.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map(b => b.textContent?.toLowerCase() ?? '');
    expect(buttonTexts.some(t => t.includes('save'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('discard'))).toBe(true);
  });

  test('calls onSave when Save is clicked', async () => {
    const onSave = jest.fn(() => Promise.resolve());

    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={onSave} onDiscard={jest.fn()} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    await act(async () => {
      fireEvent.click(container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement);
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.toLowerCase().includes('save')
    ) as HTMLElement;

    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('calls onDiscard and returns to display when Discard is clicked (clean state)', async () => {
    const onDiscard = jest.fn();

    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={onDiscard} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    await act(async () => {
      fireEvent.click(container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement);
    });

    const discardButton = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.toLowerCase().includes('discard')
    ) as HTMLElement;

    await act(async () => {
      fireEvent.click(discardButton);
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slot="display"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="editor"]')).toBeNull();
  });

  test('applies hover class on display wrapper', () => {
    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={jest.fn()} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    const displayWrapper = container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement;
    expect(displayWrapper.className).toContain('hover:bg-accent/40');
  });

  test('Escape key triggers discard when clean', async () => {
    const onDiscard = jest.fn();

    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={onDiscard} isDirty={false} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    // Enter edit mode first
    await act(async () => {
      fireEvent.click(container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement);
    });

    expect(container.querySelector('[data-slot="editor"]')).not.toBeNull();

    // Press Escape to discard
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slot="display"]')).not.toBeNull();
  });

  test('Escape key does nothing when dirty', async () => {
    const onDiscard = jest.fn();

    const { container } = renderInProvider(
      <EditableSection sectionId="s1" onSave={jest.fn()} onDiscard={onDiscard} isDirty={true} isSaving={false}>
        <EditableSection.Display>
          <span data-slot="display">Display content</span>
        </EditableSection.Display>
        <EditableSection.Editor>
          <span data-slot="editor">Editor content</span>
        </EditableSection.Editor>
      </EditableSection>
    );

    await act(async () => {
      fireEvent.click(container.querySelector('[data-testid="editable-section-s1"]') as HTMLElement);
    });

    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onDiscard).not.toHaveBeenCalled();
    // Editor should still be visible
    expect(container.querySelector('[data-slot="editor"]')).not.toBeNull();
  });
});
