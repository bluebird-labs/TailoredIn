import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditableField } from './EditableField';
import { FormModal } from './FormModal';

const meta = {
  component: FormModal,
  args: {
    open: true,
    onOpenChange: () => {},
    title: 'Add Experience',
    description: 'Add a new work experience to your resume.',
    dirtyCount: 0,
    isSaving: false,
    onSave: () => {},
    onDiscard: () => {}
  }
} satisfies Meta<typeof FormModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const formFields = (overrides?: { dirty?: boolean[]; errors?: (string | undefined)[] }) => (
  <>
    <EditableField
      type="text"
      label="Job title"
      value="Senior Frontend Engineer"
      onChange={() => {}}
      isDirty={overrides?.dirty?.[0]}
      error={overrides?.errors?.[0]}
      required
    />
    <EditableField
      type="text"
      label="Company"
      value="Acme Corp"
      onChange={() => {}}
      isDirty={overrides?.dirty?.[1]}
      error={overrides?.errors?.[1]}
      required
    />
    <EditableField
      type="select"
      label="Employment type"
      value="full-time"
      onChange={() => {}}
      options={[
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' }
      ]}
    />
    <EditableField
      type="textarea"
      label="Description"
      value="Led the frontend platform migration from legacy jQuery to React 19..."
      onChange={() => {}}
      isDirty={overrides?.dirty?.[3]}
      error={overrides?.errors?.[3]}
      placeholder="Describe your role and key accomplishments"
    />
  </>
);

export const Default: Story = {
  args: {
    children: formFields()
  }
};

export const WithDirtyFields: Story = {
  args: {
    dirtyCount: 2,
    children: formFields({ dirty: [true, false, false, true] })
  }
};

export const WithValidationErrors: Story = {
  args: {
    dirtyCount: 0,
    children: formFields({
      errors: ['Job title is required', undefined, undefined, 'Description must be at least 20 characters']
    })
  }
};

export const Saving: Story = {
  args: {
    dirtyCount: 3,
    isSaving: true,
    children: formFields({ dirty: [true, true, false, true] })
  }
};
