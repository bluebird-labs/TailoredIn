import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EditableField } from './EditableField.js';
import { EditableSection } from './EditableSection.js';
import { EditableSectionProvider } from './EditableSectionContext.js';

const meta = {
  component: EditableSection,
  decorators: [
    Story => (
      <EditableSectionProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </EditableSectionProvider>
    )
  ],
  args: {
    sectionId: 'demo',
    isDirty: false,
    isSaving: false,
    onSave: () => {},
    onDiscard: () => {},
    children: null
  }
} satisfies Meta<typeof EditableSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Section variant (no border in display mode — content sits flat on page)
// ---------------------------------------------------------------------------

export const SectionVariant: Story = {
  render: () => {
    const [name, setName] = useState('Alice Johnson');
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
      <EditableSection
        sectionId="section-variant"
        variant="section"
        isDirty={dirty}
        isSaving={saving}
        onSave={async () => {
          setSaving(true);
          await new Promise(r => setTimeout(r, 800));
          setSaving(false);
          setDirty(false);
        }}
        onDiscard={() => {
          setName('Alice Johnson');
          setDirty(false);
        }}
      >
        <EditableSection.Display>
          <div className="py-2">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">Full Stack Engineer · Paris, France</p>
          </div>
        </EditableSection.Display>
        <EditableSection.Editor>
          <EditableField
            type="text"
            label="Full name"
            value={name}
            onChange={v => {
              setName(v);
              setDirty(true);
            }}
            isDirty={dirty}
          />
        </EditableSection.Editor>
      </EditableSection>
    );
  }
};

// ---------------------------------------------------------------------------
// Card variant (always has border + rounded + padding)
// ---------------------------------------------------------------------------

export const CardVariant: Story = {
  render: () => {
    const [title, setTitle] = useState('Senior Software Engineer');
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    return (
      <EditableSection
        sectionId="card-variant"
        variant="card"
        isDirty={dirty}
        isSaving={saving}
        onSave={async () => {
          setSaving(true);
          await new Promise(r => setTimeout(r, 800));
          setSaving(false);
          setDirty(false);
        }}
        onDiscard={() => {
          setTitle('Senior Software Engineer');
          setDirty(false);
        }}
      >
        <EditableSection.Display>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">Acme Corp · Jan 2022 – Present</p>
          </div>
        </EditableSection.Display>
        <EditableSection.Editor>
          <EditableField
            type="text"
            label="Job title"
            value={title}
            onChange={v => {
              setTitle(v);
              setDirty(true);
            }}
            isDirty={dirty}
          />
        </EditableSection.Editor>
      </EditableSection>
    );
  }
};

// ---------------------------------------------------------------------------
// Editing with dirty state (starts in edit mode)
// ---------------------------------------------------------------------------

export const EditingWithDirty: Story = {
  decorators: [
    Story => (
      <EditableSectionProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </EditableSectionProvider>
    )
  ],
  render: () => {
    const [value, setValue] = useState('Senior Engineer (edited)');
    const [saving, setSaving] = useState(false);

    return (
      <EditableSection
        sectionId="editing-dirty"
        variant="card"
        isDirty={true}
        isSaving={saving}
        onSave={async () => {
          setSaving(true);
          await new Promise(r => setTimeout(r, 800));
          setSaving(false);
        }}
        onDiscard={() => setValue('Senior Engineer')}
      >
        <EditableSection.Display>
          <p className="text-sm font-medium">{value}</p>
        </EditableSection.Display>
        <EditableSection.Editor>
          <EditableField type="text" label="Job title" value={value} onChange={setValue} isDirty />
        </EditableSection.Editor>
      </EditableSection>
    );
  },
  play: async ({ canvasElement }) => {
    // Click to enter edit mode automatically
    const section = canvasElement.querySelector('[data-testid="editable-section-editing-dirty"]') as HTMLElement;
    section?.click();
  }
};

// ---------------------------------------------------------------------------
// Mutual exclusion — two sections, only one editable at a time
// ---------------------------------------------------------------------------

export const MutualExclusion: Story = {
  decorators: [
    Story => (
      <EditableSectionProvider>
        <div className="max-w-xl space-y-3">
          <Story />
        </div>
      </EditableSectionProvider>
    )
  ],
  render: () => {
    const [nameValue, setNameValue] = useState('Alice Johnson');
    const [titleValue, setTitleValue] = useState('Full Stack Engineer');
    const [nameDirty, setNameDirty] = useState(false);
    const [titleDirty, setTitleDirty] = useState(false);

    return (
      <>
        <EditableSection
          sectionId="mutual-name"
          variant="card"
          isDirty={nameDirty}
          isSaving={false}
          onSave={() => setNameDirty(false)}
          onDiscard={() => {
            setNameValue('Alice Johnson');
            setNameDirty(false);
          }}
        >
          <EditableSection.Display>
            <div>
              <p className="text-xs text-muted-foreground">Full name</p>
              <p className="text-sm font-medium">{nameValue}</p>
            </div>
          </EditableSection.Display>
          <EditableSection.Editor>
            <EditableField
              type="text"
              label="Full name"
              value={nameValue}
              onChange={v => {
                setNameValue(v);
                setNameDirty(true);
              }}
              isDirty={nameDirty}
            />
          </EditableSection.Editor>
        </EditableSection>

        <EditableSection
          sectionId="mutual-title"
          variant="card"
          isDirty={titleDirty}
          isSaving={false}
          onSave={() => setTitleDirty(false)}
          onDiscard={() => {
            setTitleValue('Full Stack Engineer');
            setTitleDirty(false);
          }}
        >
          <EditableSection.Display>
            <div>
              <p className="text-xs text-muted-foreground">Headline</p>
              <p className="text-sm font-medium">{titleValue}</p>
            </div>
          </EditableSection.Display>
          <EditableSection.Editor>
            <EditableField
              type="text"
              label="Headline"
              value={titleValue}
              onChange={v => {
                setTitleValue(v);
                setTitleDirty(true);
              }}
              isDirty={titleDirty}
            />
          </EditableSection.Editor>
        </EditableSection>
      </>
    );
  }
};
