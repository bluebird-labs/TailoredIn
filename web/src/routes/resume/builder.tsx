import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/builder')({
  beforeLoad: () => {
    throw redirect({ to: '/resume', search: { tab: 'factory' } });
  }
});
