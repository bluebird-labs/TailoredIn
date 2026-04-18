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

export const FormGroup: Story = {
  args: {
    type: 'text',
    label: 'Full name',
    value: 'Sylvain Estevez',
    onChange: () => {}
  },
  render: () => (
    <div className="max-w-lg space-y-4">
      <EditableField type="text" label="Full name" value="Sylvain Estevez" onChange={() => {}} required />
      <EditableField type="text" label="Headline" value="Full Stack Engineer" onChange={() => {}} isDirty />
      <EditableField
        type="textarea"
        label="Summary"
        value="Passionate engineer with 8 years of experience building scalable web applications..."
        onChange={() => {}}
        placeholder="Write a brief professional summary"
      />
      <EditableField type="text" label="Location" value="Paris, France" onChange={() => {}} />
    </div>
  )
};
