import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { CompanyCard } from './CompanyCard.js';

function withRouter(Story: React.ComponentType) {
  const Wrapped = () => <Story />;
  const rootRoute = createRootRoute({ component: Wrapped });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const companyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/companies/$companyId' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, companyRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] })
  });
  return <RouterProvider router={router} />;
}

const meta = {
  component: CompanyCard,
  decorators: [Story => <div className="max-w-md">{withRouter(Story)}</div>]
} satisfies Meta<typeof CompanyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {
  args: {
    company: {
      id: '1',
      name: 'Acme Corp',
      description: 'Leading provider of innovative solutions.',
      website: 'https://acme.com',
      logoUrl: null,
      linkedinLink: 'https://linkedin.com/company/acme',
      businessType: 'b2b',
      industry: 'saas',
      stage: 'series_b'
    }
  }
};

export const Minimal: Story = {
  args: {
    company: {
      id: '2',
      name: 'Tiny Startup',
      description: null,
      website: null,
      logoUrl: null,
      linkedinLink: null,
      businessType: null,
      industry: null,
      stage: null
    }
  }
};
