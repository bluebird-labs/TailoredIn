import { createFileRoute } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

export const Route = createFileRoute('/profile/')({
  component: ProfilePage
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setAbout(profile.about ?? '');
      setPhone(profile.phone ?? '');
      setLocation(profile.location ?? '');
      setLinkedinUrl(profile.linkedinUrl ?? '');
      setGithubUrl(profile.githubUrl ?? '');
      setWebsiteUrl(profile.websiteUrl ?? '');
    }
  }, [profile]);

  function handleCancel() {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setAbout(profile.about ?? '');
      setPhone(profile.phone ?? '');
      setLocation(profile.location ?? '');
      setLinkedinUrl(profile.linkedinUrl ?? '');
      setGithubUrl(profile.githubUrl ?? '');
      setWebsiteUrl(profile.websiteUrl ?? '');
    }
    setEditing(false);
  }

  function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    updateProfile.mutate(
      {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        about: about.trim() || null,
        phone: phone.trim() || null,
        location: location.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        github_url: githubUrl.trim() || null,
        website_url: websiteUrl.trim() || null
      },
      {
        onSuccess: () => setEditing(false),
        onError: () => toast.error('Failed to update profile')
      }
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;
  if (!profile) return <div className="text-sm text-muted-foreground">No profile found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground text-sm">Your professional identity.</p>
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Edit profile">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6 max-w-lg">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input id="linkedinUrl" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="githubUrl">GitHub</Label>
              <Input id="githubUrl" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input id="websiteUrl" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="about">About</Label>
            <p className="text-xs text-muted-foreground">
              A narrative description of your professional identity. This will be used to infer your tone.
            </p>
            <Textarea
              id="about"
              rows={5}
              value={about}
              onChange={e => setAbout(e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={updateProfile.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-lg">
          <div className="grid gap-4">
            <ProfileField label="Name" value={`${profile.firstName} ${profile.lastName}`} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField label="Phone" value={profile.phone} />
            <ProfileField label="Location" value={profile.location} />
            <ProfileField label="LinkedIn" value={profile.linkedinUrl} />
            <ProfileField label="GitHub" value={profile.githubUrl} />
            <ProfileField label="Website" value={profile.websiteUrl} />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">About</p>
            <p className="text-sm mt-0.5 whitespace-pre-wrap">
              {profile.about || <span className="italic text-muted-foreground">Not set</span>}
            </p>
          </div>
        </div>
      )}
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
