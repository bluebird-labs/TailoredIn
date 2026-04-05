import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider
} from '@tanstack/react-router';
import { Breadcrumb } from './Breadcrumb.js';

function withRouter(Story: React.ComponentType) {
  const Wrapped = () => <Story />;
  const rootRoute = createRootRoute({ component: Wrapped });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });
  const companiesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/companies' });
  const experiencesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/experiences' });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, companiesRoute, experiencesRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] })
  });
  return <RouterProvider router={router} />;
}

const meta = {
  component: Breadcrumb,
  decorators: [Story => <div className="max-w-md">{withRouter(Story)}</div>]
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Companies: Story = {
  args: { parentLabel: 'Companies', parentTo: '/companies', current: 'Acme Corporation' }
};

export const Experiences: Story = {
  args: { parentLabel: 'Experiences', parentTo: '/experiences', current: 'Senior Software Engineer' }
};
