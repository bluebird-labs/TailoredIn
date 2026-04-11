import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Download } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EducationList } from '@/components/resume/education/EducationList.js';
import { ExperienceList } from '@/components/resume/experience/ExperienceList.js';
import { ProfileDisplay } from '@/components/resume/profile/ProfileDisplay.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { EditableSectionProvider } from '@/components/shared/EditableSectionContext.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import type { Education } from '@/hooks/use-educations.js';
import { useEducations } from '@/hooks/use-educations.js';
import type { Experience } from '@/hooks/use-experiences.js';
import { useExperiences } from '@/hooks/use-experiences.js';
import { useNavGuard } from '@/hooks/use-nav-guard.js';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { hasErrors, type ProfileFormState, type ValidationErrors, validateProfile } from '@/lib/validation.js';

const PROFILE_TABS = ['profile', 'experiences', 'education'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];
type ProfileSearch = { tab?: ProfileTab };

export const Route = createFileRoute('/profile/')({
  component: ProfilePage,
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const tab = search.tab;
    if (PROFILE_TABS.includes(tab as ProfileTab)) {
      return { tab: tab as ProfileTab };
    }
    return {};
  }
});

function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function generateProfileMarkdown(profile: ProfileData, experiences: Experience[], educations: Education[]): string {
  const lines: string[] = [];

  lines.push(`# ${profile.firstName} ${profile.lastName}`);
  lines.push('');

  const contactParts: string[] = [];
  if (profile.location) contactParts.push(profile.location);
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (contactParts.length > 0) {
    lines.push(contactParts.join(' | '));
    lines.push('');
  }

  if (profile.about) {
    lines.push('## About');
    lines.push('');
    lines.push(profile.about);
    lines.push('');
  }

  const links: string[] = [];
  if (profile.linkedinUrl) links.push(`- [LinkedIn](${profile.linkedinUrl})`);
  if (profile.githubUrl) links.push(`- [GitHub](${profile.githubUrl})`);
  if (profile.websiteUrl) links.push(`- [Website](${profile.websiteUrl})`);
  if (links.length > 0) {
    lines.push('## Links');
    lines.push('');
    lines.push(...links);
    lines.push('');
  }

  const sortedExperiences = [...experiences].sort((a, b) => a.ordinal - b.ordinal);
  if (sortedExperiences.length > 0) {
    lines.push('## Experience');
    lines.push('');

    for (const exp of sortedExperiences) {
      lines.push(`### ${exp.title} — ${exp.companyName}`);
      lines.push('');

      const meta: string[] = [];
      if (exp.location) meta.push(exp.location);
      const start = formatMonthYear(exp.startDate);
      const end = formatMonthYear(exp.endDate);
      if (start && end) meta.push(`${start} — ${end}`);
      if (meta.length > 0) {
        lines.push(meta.join(' | '));
        lines.push('');
      }

      if (exp.summary) {
        lines.push(exp.summary);
        lines.push('');
      }

      const sortedAccomplishments = [...exp.accomplishments].sort((a, b) => a.ordinal - b.ordinal);
      if (sortedAccomplishments.length > 0) {
        lines.push('**Accomplishments:**');
        lines.push('');
        for (const acc of sortedAccomplishments) {
          lines.push(`- **${acc.title}**: ${acc.narrative}`);
        }
        lines.push('');
      }
    }
  }

  const sortedEducations = [...educations].sort((a, b) => a.ordinal - b.ordinal);
  if (sortedEducations.length > 0) {
    lines.push('## Education');
    lines.push('');

    for (const edu of sortedEducations) {
      lines.push(`### ${edu.degreeTitle} — ${edu.institutionName}`);
      lines.push('');

      const eduMeta: string[] = [String(edu.graduationYear)];
      if (edu.location) eduMeta.push(edu.location);
      if (edu.honors) eduMeta.push(edu.honors);
      lines.push(eduMeta.join(' | '));
      lines.push('');
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function ProfilePage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const activeTab = tab ?? 'profile';

  const setActiveTab = useCallback(
    (value: string | null) => {
      if (value) {
        navigate({ to: '/profile', search: { tab: value as ProfileTab }, replace: true });
      }
    },
    [navigate]
  );

  const { data: profile, isLoading } = useProfile();
  const { data: experiences = [] } = useExperiences();
  const { data: educations = [] } = useEducations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader profile={null} experiences={[]} educations={[]} />
        <LoadingSkeleton variant="form" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader profile={null} experiences={[]} educations={[]} />
        <EmptyState message="No profile found." />
      </div>
    );
  }

  const experienceCount = experiences.length;
  const educationCount = educations.length;

  return (
    <EditableSectionProvider>
      <div className="space-y-6">
        <PageHeader profile={profile} experiences={experiences} educations={educations} />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="experiences">
              Experiences
              {experienceCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                  {experienceCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="education">
              Education
              {educationCount > 0 && (
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground">
                  {educationCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="mt-4">
              <ProfileSection profile={profile} />
            </div>
          </TabsContent>
          <TabsContent value="experiences">
            <div className="mt-4">
              <ExperienceList />
            </div>
          </TabsContent>
          <TabsContent value="education">
            <div className="mt-4">
              <EducationList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EditableSectionProvider>
  );
}

function PageHeader({
  profile,
  experiences,
  educations
}: {
  readonly profile: ProfileData | null;
  readonly experiences: Experience[];
  readonly educations: Education[];
}) {
  const handleDownload = useCallback(async () => {
    if (!profile) return;

    const markdown = generateProfileMarkdown(profile, experiences, educations);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${timestamp}-${profile.firstName.toLowerCase()}-${profile.lastName.toLowerCase()}-profile.md`;

    const w = window as Window & { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> };
    if (w.showSaveFilePicker) {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'Markdown Document', accept: { 'text/markdown': ['.md'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch {
        // User cancelled the picker — do nothing
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile, experiences, educations]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="page-heading">Profile</h1>
        <p className="text-muted-foreground text-sm">Your professional identity.</p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={handleDownload} disabled={!profile} title="Download as Markdown">
        <Download className="h-4 w-4" />
      </Button>
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

function ProfileSection({ profile }: { readonly profile: ProfileData }) {
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
  );
}
