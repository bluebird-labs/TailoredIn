import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingSkeleton } from './LoadingSkeleton';

const meta = {
  component: LoadingSkeleton
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: { variant: 'card' }
};

export const List: Story = {
  args: { variant: 'list', count: 5 }
};

export const Form: Story = {
  args: { variant: 'form' }
};

export const Detail: Story = {
  args: { variant: 'detail' }
};
