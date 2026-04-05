import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileDisplay } from './ProfileDisplay.js';

const meta = {
  title: 'Resume/ProfileDisplay',
  component: ProfileDisplay,
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof ProfileDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullProfile: Story = {
  args: {
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+1 555-0100',
      location: 'San Francisco, CA',
      about: "Experienced software engineer with a passion for building products that make people's lives better.",
      linkedinUrl: 'https://linkedin.com/in/janedoe',
      githubUrl: 'https://github.com/janedoe',
      websiteUrl: 'https://janedoe.dev'
    }
  }
};

export const MinimalProfile: Story = {
  args: {
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: null,
      location: null,
      about: null,
      linkedinUrl: null,
      githubUrl: null,
      websiteUrl: null
    }
  }
};
