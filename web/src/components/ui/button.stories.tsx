import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Loader2, Plus } from 'lucide-react';

import { Button } from './button.js';

const meta = {
  component: Button
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  )
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus data-icon="inline-start" />
        Add experience
      </Button>
      <Button variant="outline">
        <Download data-icon="inline-start" />
        Export
      </Button>
    </div>
  )
};

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <Loader2 className="animate-spin" data-icon="inline-start" />
      Saving...
    </Button>
  )
};
