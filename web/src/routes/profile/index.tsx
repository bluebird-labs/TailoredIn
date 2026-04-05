import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ProfileDisplay } from '@/components/resume/profile/ProfileDisplay.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { hasErrors, type ProfileFormState, type ValidationErrors, validateProfile } from '@/lib/validation.js';

export const Route = createFileRoute('/profile/')({
  component: ProfilePage
});

function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div>
          <LoadingSkeleton variant="form" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState message="No profile found." />
      </div>
    );
  }

  return <ProfileForm profile={profile} />;
}

function PageHeader() {
  return (
    <div>
      <h1 className="page-heading">Profile</h1>
      <p className="text-muted-foreground text-sm">Your professional identity.</p>
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

function ProfileForm({ profile }: { readonly profile: ProfileData }) {
  const updateProfile = useUpdateProfile();
  const [errors, setErrors] = useState<ValidationErrors<ProfileFormState>>({});

  const savedState = useMemo<ProfileFormState>(
    () => ({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      linkedinUrl: profile.linkedinUrl ?? '',
      githubUrl: profile.githubUrl ?? '',
      websiteUrl: profile.websiteUrl ?? '',
      about: profile.about ?? ''
    }),
    [
      profile.firstName,
      profile.lastName,
      profile.email,
      profile.phone,
      profile.location,
      profile.linkedinUrl,
      profile.githubUrl,
      profile.websiteUrl,
      profile.about
    ]
  );

  const { current, setField, isDirtyField, isDirty, reset } = useDirtyTracking(savedState);

  useNavGuard({ isDirty });

  function handleSave() {
    const validationErrors = validateProfile(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    updateProfile.mutate(
      {
        email: current.email.trim(),
        first_name: current.firstName.trim(),
        last_name: current.lastName.trim(),
        about: current.about.trim() || null,
        phone: current.phone.trim() || null,
        location: current.location.trim() || null,
        linkedin_url: current.linkedinUrl.trim() || null,
        github_url: current.githubUrl.trim() || null,
        website_url: current.websiteUrl.trim() || null
      },
      {
        onSuccess: () => {
          setErrors({});
          toast.success('Changes saved');
        },
        onError: () => toast.error('Failed to save. Please try again.')
      }
    );
  }

  return (
    <EditableSectionProvider>
      <div className="space-y-6">
        <PageHeader />

        <div>
          <EditableSection
            sectionId="profile"
            variant="card"
            onSave={handleSave}
            onDiscard={reset}
            isDirty={isDirty}
            isSaving={updateProfile.isPending}
          >
            <EditableSection.Display>
              <ProfileDisplay profile={profile} />
            </EditableSection.Display>

            <EditableSection.Editor>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <EditableField
                    type="text"
                    label="First Name"
                    required
                    value={current.firstName}
                    onChange={v => setField('firstName', v)}
                    isDirty={isDirtyField('firstName')}
                    error={errors.firstName}
                    disabled={updateProfile.isPending}
                  />
                  <EditableField
                    type="text"
                    label="Last Name"
                    required
                    value={current.lastName}
                    onChange={v => setField('lastName', v)}
                    isDirty={isDirtyField('lastName')}
                    error={errors.lastName}
                    disabled={updateProfile.isPending}
                  />
                </div>

                <EditableField
                  type="text"
                  label="Email"
                  required
                  value={current.email}
                  onChange={v => setField('email', v)}
                  isDirty={isDirtyField('email')}
                  error={errors.email}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text"
                  label="Phone"
                  value={current.phone}
                  onChange={v => setField('phone', v)}
                  isDirty={isDirtyField('phone')}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text"
                  label="Location"
                  value={current.location}
                  onChange={v => setField('location', v)}
                  isDirty={isDirtyField('location')}
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text"
                  label="LinkedIn"
                  value={current.linkedinUrl}
                  onChange={v => setField('linkedinUrl', v)}
                  isDirty={isDirtyField('linkedinUrl')}
                  placeholder="https://linkedin.com/in/..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text"
                  label="GitHub"
                  value={current.githubUrl}
                  onChange={v => setField('githubUrl', v)}
                  isDirty={isDirtyField('githubUrl')}
                  placeholder="https://github.com/..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="text"
                  label="Website"
                  value={current.websiteUrl}
                  onChange={v => setField('websiteUrl', v)}
                  isDirty={isDirtyField('websiteUrl')}
                  placeholder="https://..."
                  disabled={updateProfile.isPending}
                />
                <EditableField
                  type="textarea"
                  label="About"
                  value={current.about}
                  onChange={v => setField('about', v)}
                  isDirty={isDirtyField('about')}
                  rows={5}
                  placeholder="A narrative description of your professional identity..."
                  disabled={updateProfile.isPending}
                />
              </div>
            </EditableSection.Editor>
          </EditableSection>
        </div>
      </div>
    </EditableSectionProvider>
  );
}
