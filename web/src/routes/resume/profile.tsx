import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/resume/profile')({
  component: ProfilePage
});

function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-muted-foreground mt-2">Your personal info and headlines.</p>
    </div>
  );
}
