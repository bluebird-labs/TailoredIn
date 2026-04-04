import type { Meta, StoryObj } from '@storybook/react-vite';

import { EditableField } from './EditableField.js';

const meta = {
  component: EditableField
} satisfies Meta<typeof EditableField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    type: 'text',
    label: 'Full name',
    value: 'Alice Johnson',
    onChange: () => {}
  }
};

export const TextDirty: Story = {
  args: {
    type: 'text',
    label: 'Full name',
    value: 'Bob Smith',
    onChange: () => {},
    isDirty: true
  }
};

export const TextWithError: Story = {
  args: {
    type: 'text',
    label: 'Email',
    value: '',
    onChange: () => {},
    required: true,
    error: 'Email is required'
  }
};

export const TextareaField: Story = {
  args: {
    type: 'textarea',
    label: 'About',
    value: 'A brief description...',
    onChange: () => {},
    placeholder: 'Tell us about yourself'
  }
};

export const SelectField: Story = {
  args: {
    type: 'select',
    label: 'Employment type',
    value: 'full-time',
    onChange: () => {},
    options: [
      { label: 'Full-time', value: 'full-time' },
      { label: 'Part-time', value: 'part-time' },
      { label: 'Contract', value: 'contract' }
    ]
  }
};

export const Disabled: Story = {
  args: {
    type: 'text',
    label: 'Read-only field',
    value: 'Cannot edit',
    onChange: () => {},
    disabled: true
  }
};
