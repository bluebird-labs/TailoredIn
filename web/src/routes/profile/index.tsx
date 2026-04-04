import { createFileRoute } from '@tanstack/react-router';
import { useProfile } from '@/hooks/use-profile';

export const Route = createFileRoute('/profile/')({
  component: ProfilePage
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  if (!profile) return <div className="text-sm text-muted-foreground">No profile found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm">Your professional identity.</p>
      </div>

      <div className="grid gap-4 max-w-lg">
        <ProfileField label="Name" value={`${profile.firstName} ${profile.lastName}`} />
        <ProfileField label="Email" value={profile.email} />
        <ProfileField label="Phone" value={profile.phone} />
        <ProfileField label="Location" value={profile.location} />
        <ProfileField label="LinkedIn" value={profile.linkedinUrl} />
        <ProfileField label="GitHub" value={profile.githubUrl} />
        <ProfileField label="Website" value={profile.websiteUrl} />
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm mt-0.5">{value || <span className="italic text-muted-foreground">Not set</span>}</p>
    </div>
  );
}
