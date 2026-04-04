import { createFileRoute } from '@tanstack/react-router';
import { Check, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

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
        <h1 className="text-2xl font-medium">Profile</h1>
        <p className="text-muted-foreground text-sm">Your professional identity.</p>
      </div>

      <div className="space-y-6 max-w-lg">
        <div className="grid gap-4">
          <NameField firstName={profile.firstName} lastName={profile.lastName} profile={profile} />
          <ProfileField label="Email" value={profile.email} fieldKey="email" profile={profile} />
          <ProfileField label="Phone" value={profile.phone} fieldKey="phone" profile={profile} />
          <ProfileField label="Location" value={profile.location} fieldKey="location" profile={profile} />
          <ProfileField label="LinkedIn" value={profile.linkedinUrl} fieldKey="linkedinUrl" profile={profile} />
          <ProfileField label="GitHub" value={profile.githubUrl} fieldKey="githubUrl" profile={profile} />
          <ProfileField label="Website" value={profile.websiteUrl} fieldKey="websiteUrl" profile={profile} />
        </div>

        <AboutField about={profile.about} profile={profile} />
      </div>
    </div>
  );
}

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  about: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

function buildUpdatePayload(profile: ProfileData, overrides: Partial<ProfileData>) {
  const merged = { ...profile, ...overrides };
  return {
    email: merged.email,
    first_name: merged.firstName,
    last_name: merged.lastName,
    about: merged.about || null,
    phone: merged.phone || null,
    location: merged.location || null,
    linkedin_url: merged.linkedinUrl || null,
    github_url: merged.githubUrl || null,
    website_url: merged.websiteUrl || null
  };
}

function NameField({ firstName, lastName, profile }: { firstName: string; lastName: string; profile: ProfileData }) {
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const updateProfile = useUpdateProfile();

  function handleSave() {
    if (!first.trim() || !last.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    updateProfile.mutate(buildUpdatePayload(profile, { firstName: first.trim(), lastName: last.trim() }), {
      onSuccess: () => setEditing(false),
      onError: () => toast.error('Failed to update profile')
    });
  }

  function handleCancel() {
    setFirst(firstName);
    setLast(lastName);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
        <div className="grid grid-cols-2 gap-2">
          <Input value={first} onChange={e => setFirst(e.target.value)} placeholder="First name" className="text-sm" />
          <Input value={last} onChange={e => setLast(e.target.value)} placeholder="Last name" className="text-sm" />
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</p>
        <p className="text-sm mt-0.5">
          {firstName} {lastName}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

function ProfileField({
  label,
  value,
  fieldKey,
  profile
}: {
  label: string;
  value: string | null | undefined;
  fieldKey: string;
  profile: ProfileData;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const updateProfile = useUpdateProfile();

  function handleSave() {
    if (fieldKey === 'email' && !draft.trim()) {
      toast.error('Email is required');
      return;
    }
    updateProfile.mutate(buildUpdatePayload(profile, { [fieldKey]: draft.trim() || null }), {
      onSuccess: () => setEditing(false),
      onError: () => toast.error('Failed to update profile')
    });
  }

  function handleCancel() {
    setDraft(value ?? '');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="text-sm"
          type={fieldKey === 'email' ? 'email' : 'text'}
        />
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm mt-0.5">{value || <span className="italic text-muted-foreground">Not set</span>}</p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}

function AboutField({ about, profile }: { about: string | null; profile: ProfileData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(about ?? '');
  const updateProfile = useUpdateProfile();

  function handleSave() {
    updateProfile.mutate(buildUpdatePayload(profile, { about: draft.trim() || null }), {
      onSuccess: () => setEditing(false),
      onError: () => toast.error('Failed to update profile')
    });
  }

  function handleCancel() {
    setDraft(about ?? '');
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">About</p>
        <p className="text-xs text-muted-foreground">
          A narrative description of your professional identity. This will be used to infer your tone.
        </p>
        <Textarea
          rows={5}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Tell us about yourself..."
          className="text-sm resize-none"
        />
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleSave}
            disabled={updateProfile.isPending}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">About</p>
        <p className="text-sm mt-0.5 whitespace-pre-wrap">
          {about || <span className="italic text-muted-foreground">Not set</span>}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
}
