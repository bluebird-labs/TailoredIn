import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoCard, InfoRow } from './InfoCard.js';

const meta = {
  component: InfoCard,
  decorators: [
    Story => (
      <div className="max-w-sm">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof InfoCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Description: Story = {
  args: {
    label: 'About',
    children: (
      <p className="text-[14px] leading-relaxed tracking-[0.01em]">
        Acme Corporation is a leading SaaS platform helping businesses streamline their operations through AI-powered
        workflow automation.
      </p>
    )
  }
};

export const KeyValueRows: Story = {
  args: {
    label: 'Details',
    children: (
      <>
        <InfoRow label="Website" value="acme.com" href="https://acme.com" />
        <InfoRow label="Industry" value="Technology" />
        <InfoRow label="Stage" value="Series B" />
        <InfoRow label="Business Type" value={null} />
      </>
    )
  }
};
