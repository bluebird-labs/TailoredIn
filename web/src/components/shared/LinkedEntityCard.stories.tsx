import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { LinkedEntityCard } from './LinkedEntityCard.js';

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
  component: LinkedEntityCard,
  decorators: [Story => <div className="max-w-xs">{withRouter(Story)}</div>]
} satisfies Meta<typeof LinkedEntityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitial: Story = {
  args: { to: '/companies/1', logo: 'A', name: 'Acme Corporation', meta: 'SaaS · Series B' }
};

export const MinimalMeta: Story = {
  args: { to: '/companies/2', logo: 'T', name: 'Tiny Startup', meta: '' }
};
