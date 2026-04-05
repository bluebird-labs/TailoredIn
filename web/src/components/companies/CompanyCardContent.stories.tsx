import type { Meta, StoryObj } from '@storybook/react-vite';
import { CompanyCard } from './CompanyCard.js';

const meta = {
  component: CompanyCard,
  decorators: [
    Story => (
      <div className="max-w-md">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof CompanyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    company: {
      id: '1',
      name: 'Acme Corp',
      website: 'https://acme.com',
      logoUrl: null,
      linkedinLink: 'https://linkedin.com/company/acme',
      businessType: 'b2b',
      industry: 'saas',
      stage: 'series_b'
    },
    onClick: () => {}
  }
};

export const Minimal: Story = {
  args: {
    company: {
      id: '2',
      name: 'Tiny Startup',
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    },
    onClick: () => {}
  }
};
