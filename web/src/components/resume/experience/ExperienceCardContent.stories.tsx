import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { ExperienceCard } from './ExperienceCard.js';

function withRouter(Story: React.ComponentType) {
  const Wrapped = () => <Story />;
  const rootRoute = createRootRoute({ component: Wrapped });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const experienceRoute = createRoute({ getParentRoute: () => rootRoute, path: '/experiences/$experienceId' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, experienceRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] })
  });
  return <RouterProvider router={router} />;
}

const meta = {
  component: ExperienceCard,
  decorators: [Story => <div className="max-w-md">{withRouter(Story)}</div>]
} satisfies Meta<typeof ExperienceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    experience: {
      id: '1',
      title: 'Senior Engineer',
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.com',
      companyAccent: null,
      companyId: null,
      company: null,
      location: 'San Francisco, CA',
      startDate: '2022-01',
      endDate: '2024-03',
      summary: 'Led the migration of the billing system to microservices.',
      ordinal: 0,
      accomplishments: [
        { id: 'a1', title: 'Reduced latency by 40%', narrative: '', ordinal: 0 },
        { id: 'a2', title: 'Mentored 3 junior engineers', narrative: '', ordinal: 1 }
      ]
    }
  }
};

export const Minimal: Story = {
  args: {
    experience: {
      id: '2',
      title: 'Junior Developer',
      companyName: 'StartupCo',
      companyWebsite: null,
      companyAccent: null,
      companyId: null,
      company: null,
      location: 'Remote',
      startDate: '2020-06',
      endDate: '2021-12',
      summary: null,
      ordinal: 0,
      accomplishments: []
    }
  }
};
