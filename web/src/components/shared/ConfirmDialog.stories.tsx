import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/button';

import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  component: ConfirmDialog
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteConfirmation: Story = {
  args: {
    title: 'Delete experience?',
    description:
      'This action cannot be undone. This will permanently delete this experience and all its accomplishments.',
    confirmLabel: 'Delete',
    confirmVariant: 'destructive',
    onConfirm: () => {},
    trigger: <Button variant="destructive">Delete</Button>
  }
};

export const DiscardChanges: Story = {
  args: {
    title: 'Discard unsaved changes?',
    description: 'You have unsaved changes that will be lost.',
    confirmLabel: 'Discard',
    confirmVariant: 'destructive',
    onConfirm: () => {},
    trigger: <Button variant="ghost">Leave page</Button>
  }
};
