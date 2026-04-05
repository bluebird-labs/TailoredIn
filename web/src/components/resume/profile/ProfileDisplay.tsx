import { cn } from '@/lib/utils';

interface ProfileDisplayProps {
  readonly profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    about: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
  };
  readonly className?: string;
}

function FieldLabel({ children }: { readonly children: string }) {
  return <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-1">{children}</p>;
}

function FieldValue({ value }: { readonly value: string | null }) {
  if (!value) return <p className="text-sm text-muted-foreground italic">Not set</p>;
  return <p className="text-sm">{value}</p>;
}

function LinkValue({ url }: { readonly url: string | null }) {
  if (!url) return <FieldValue value={null} />;
  const displayUrl = url.replace(/^https?:\/\//, '');
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-primary hover:underline"
      onClick={e => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
}

function GroupLabel({ children }: { readonly children: string }) {
  return <p className="text-xs uppercase tracking-[0.04em] text-muted-foreground/70 mb-2.5">{children}</p>;
}

function ProfileDisplay({ profile, className }: ProfileDisplayProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {/* Identity */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>Identity</GroupLabel>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel>First Name</FieldLabel>
            <FieldValue value={profile.firstName} />
          </div>
          <div>
            <FieldLabel>Last Name</FieldLabel>
            <FieldValue value={profile.lastName} />
          </div>
          <div>
            <FieldLabel>Location</FieldLabel>
            <FieldValue value={profile.location} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>Contact</GroupLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Email</FieldLabel>
            <FieldValue value={profile.email} />
          </div>
          <div>
            <FieldLabel>Phone</FieldLabel>
            <FieldValue value={profile.phone} />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="pb-4 mb-4 border-b border-border/50">
        <GroupLabel>About</GroupLabel>
        <FieldValue value={profile.about} />
      </div>

      {/* Links */}
      <div>
        <GroupLabel>Links</GroupLabel>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel>GitHub</FieldLabel>
            <LinkValue url={profile.githubUrl} />
          </div>
          <div>
            <FieldLabel>LinkedIn</FieldLabel>
            <LinkValue url={profile.linkedinUrl} />
          </div>
          <div>
            <FieldLabel>Website</FieldLabel>
            <LinkValue url={profile.websiteUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ProfileDisplayProps };
export { ProfileDisplay };
