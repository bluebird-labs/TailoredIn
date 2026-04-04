import type { Meta, StoryObj } from '@storybook/react-vite';

import { EmptyState } from './EmptyState';

const meta = {
  component: EmptyState
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  args: {
    message: 'No experiences yet',
    actionLabel: 'Add experience',
    onAction: () => {}
  }
};

export const WithoutAction: Story = {
  args: {
    message: 'No results found'
  }
};
