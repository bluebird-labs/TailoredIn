import type { Meta, StoryObj } from '@storybook/react';
import { EducationCardContent } from './EducationCardContent.js';

const meta = {
  title: 'Resume/EducationCardContent',
  component: EducationCardContent,
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof EducationCardContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    education: {
      id: '1',
      degreeTitle: 'B.S. Computer Science',
      institutionName: 'Stanford University',
      graduationYear: 2018,
      location: 'Stanford, CA',
      honors: 'Magna Cum Laude',
      ordinal: 0
    }
  }
};

export const Minimal: Story = {
  args: {
    education: {
      id: '2',
      degreeTitle: 'M.S. Data Science',
      institutionName: 'MIT',
      graduationYear: 2020,
      location: null,
      honors: null,
      ordinal: 1
    }
  }
};
