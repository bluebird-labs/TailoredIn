import type { Meta, StoryObj } from '@storybook/react-vite';

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from './collapsible.js';

const meta = {
  component: Collapsible,
  decorators: [
    Story => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  render: () => (
    <Collapsible defaultOpen={false}>
      <div className="rounded-[14px] border bg-card p-5">
        <CollapsibleTrigger>Raw Text</CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="pt-3">
            <p className="text-[13px] leading-relaxed text-foreground">
              We are looking for a Senior Software Engineer to join our team. You will work on building scalable
              distributed systems and collaborate with cross-functional teams to deliver high-quality products.
            </p>
          </div>
        </CollapsiblePanel>
      </div>
    </Collapsible>
  )
};

export const Expanded: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <div className="rounded-[14px] border bg-card p-5">
        <CollapsibleTrigger>Raw Text</CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="pt-3">
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground">
              {`Senior Software Engineer — Acme Corp

About the role:
We are looking for a Senior Software Engineer to join our team.
You will work on building scalable distributed systems and
collaborate with cross-functional teams to deliver high-quality products.

Requirements:
• 5+ years of experience in software engineering
• Strong proficiency in TypeScript and React
• Experience with distributed systems`}
            </pre>
          </div>
        </CollapsiblePanel>
      </div>
    </Collapsible>
  )
};
