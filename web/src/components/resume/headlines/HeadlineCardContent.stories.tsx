import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeadlineCardContent } from './HeadlineCardContent.js';

const meta = {
  title: 'Resume/HeadlineCardContent',
  component: HeadlineCardContent,
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof HeadlineCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithSummary: Story = {
  args: {
    headline: {
      id: '1',
      label: 'Senior Software Engineer',
      summaryText: 'Full-stack engineer specializing in distributed systems and developer tooling.'
    }
  }
};

export const WithoutSummary: Story = {
  args: {
    headline: {
      id: '2',
      label: 'Product Manager',
      summaryText: ''
    }
  }
};
