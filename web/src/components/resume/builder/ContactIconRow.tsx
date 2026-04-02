import { Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';

/** Simple inline SVG for LinkedIn (Lucide doesn't include brand icons). */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="LinkedIn"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

/** Simple inline SVG for GitHub. */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="GitHub">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

type ContactItem = {
  icon: ReactNode;
  value: string;
};

type ContactIconRowProps = {
  linkedin: string;
  email: string;
  phone: string;
  location: string;
  github: string;
};

export function ContactIconRow({ linkedin, email, phone, location, github }: ContactIconRowProps) {
  const iconClass = 'w-3 h-3 shrink-0';
  const items: ContactItem[] = [
    { icon: <LinkedInIcon className={iconClass} />, value: linkedin },
    { icon: <Mail className={iconClass} />, value: email },
    { icon: <Phone className={iconClass} />, value: phone },
    { icon: <MapPin className={iconClass} />, value: location },
    { icon: <GitHubIcon className={iconClass} />, value: github }
  ].filter(i => i.value);

  return (
    <div className="flex items-center gap-x-3.5 gap-y-1 flex-wrap mt-1.5 text-[11px] text-[#555]">
      {items.map(({ icon, value }) => (
        <span key={value} className="inline-flex items-center gap-1">
          {icon}
          {value}
        </span>
      ))}
    </div>
  );
}
