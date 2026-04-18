import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/job-descriptions/$jobDescriptionId')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/jobs/$jobDescriptionId', params });
  }
});
