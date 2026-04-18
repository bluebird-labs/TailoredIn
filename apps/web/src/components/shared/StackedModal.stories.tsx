import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../ui/button.js';
import { FormModal } from './FormModal.js';

function StackedModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Edit Company"
        description="Update company information"
        dirtyCount={1}
        isSaving={false}
        onSave={() => {}}
        onDiscard={() => setOpen(false)}
      >
        <div className="space-y-3 p-2">
          <p className="text-sm text-muted-foreground">
            Make a change, then click Cancel to see the stacked modal effect.
          </p>
          <div className="rounded-lg border p-3">
            <span className="text-xs text-muted-foreground">Company name</span>
            <div className="mt-1 rounded-md border border-l-2 border-l-primary/30 px-3 py-1.5 text-sm">
              Acme Corporation (modified)
            </div>
          </div>
        </div>
      </FormModal>
    </>
  );
}

const meta = {
  component: StackedModalDemo,
  parameters: { layout: 'centered' }
} satisfies Meta<typeof StackedModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
