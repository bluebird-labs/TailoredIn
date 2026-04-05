import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../ui/button.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from './DetailPageHeader.js';

const meta = {
  component: DetailPageHeader,
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof DetailPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompanyHeader: Story = {
  args: {
    logo: (
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
        A
      </div>
    ),
    title: 'Acme Corporation',
    meta: (
      <>
        <MetaBadge>SaaS</MetaBadge>
        <MetaDot />
        <MetaText>Series B</MetaText>
        <MetaDot />
        <MetaText>Technology</MetaText>
      </>
    ),
    actions: (
      <>
        <Button variant="outline" size="sm">
          Website
        </Button>
        <Button size="sm">Edit</Button>
      </>
    )
  }
};

export const ExperienceHeader: Story = {
  args: {
    logo: (
      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground">
        A
      </div>
    ),
    title: 'Senior Software Engineer',
    meta: (
      <>
        <span className="text-[13px] text-primary">↗ Acme Corporation</span>
        <MetaDot />
        <MetaText>San Francisco, CA</MetaText>
        <MetaDot />
        <MetaText>Mar 2022 – Present</MetaText>
      </>
    ),
    actions: <Button size="sm">Edit</Button>
  }
};
