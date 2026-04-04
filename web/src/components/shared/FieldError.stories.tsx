import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldError } from './FieldError';

const meta = {
  component: FieldError
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMessage: Story = {
  args: {
    message: 'This field is required'
  }
};

export const Empty: Story = {
  args: {
    message: undefined
  }
};
