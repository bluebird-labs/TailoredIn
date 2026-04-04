import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/skills')({
  beforeLoad: () => {
    throw redirect({ to: '/resume', search: { tab: 'skills' } });
  }
});
