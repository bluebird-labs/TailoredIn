import type { Meta, StoryObj } from '@storybook/react-vite';

import { SaveBar } from './SaveBar';

const meta = {
  component: SaveBar,
  decorators: [
    Story => (
      <div className="relative min-h-[200px] border border-border rounded-lg">
        <div className="p-5 text-sm text-muted-foreground">Aggregate content area</div>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SaveBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleChange: Story = {
  args: {
    dirtyCount: 1,
    onSave: () => {},
    onDiscard: () => {}
  }
};

export const MultipleChanges: Story = {
  args: {
    dirtyCount: 5,
    onSave: () => {},
    onDiscard: () => {}
  }
};

export const Saving: Story = {
  args: {
    dirtyCount: 3,
    onSave: () => {},
    onDiscard: () => {},
    isSaving: true
  }
};

export const Inline: Story = {
  args: {
    dirtyCount: 2,
    variant: 'inline',
    onSave: () => {},
    onDiscard: () => {}
  }
};

export const InlineSaving: Story = {
  args: {
    dirtyCount: 1,
    variant: 'inline',
    onSave: () => {},
    onDiscard: () => {},
    isSaving: true
  }
};
