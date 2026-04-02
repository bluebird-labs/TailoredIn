import { Eye, EyeOff, Pencil, RefreshCw } from 'lucide-react';
import { useCallback } from 'react';
import type { Experience } from '@/components/resume/experience/types';
import { formatDateRange } from '@/components/resume/experience/types';
import type { Education } from '@/hooks/use-education';
import { ContactIconRow } from './ContactIconRow';

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
};

type Headline = { id: string; summaryText: string };

type CompanyGroup = {
  company: string;
  dateRange: string;
  positions: {
    exp: Experience;
    visibleBullets: { id: string; text: string }[];
  }[];
};

type ResumePreviewProps = {
  profile: Profile;
  headlines: Headline[];
  selectedHeadlineId: string;
  experiences: Experience[];
  visibleBulletVariantIds: Map<string, Set<string>>;
  educations: Education[];
  visibleEducationIds: Set<string>;
  onEditPersonalInfo: () => void;
  onSwapHeadline: () => void;
  onEditCompany: (company: string) => void;
  onToggleEducation: (id: string) => void;
};

/** Extract the last path segment from a URL. */
function extractHandle(url: string | null): string {
  if (!url) return '';
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}

/** Group consecutive experiences by company. */
function groupByCompany(experiences: Experience[], visibleBulletVariantIds: Map<string, Set<string>>): CompanyGroup[] {
  const groups: CompanyGroup[] = [];

  for (const exp of experiences) {
    const variantIds = visibleBulletVariantIds.get(exp.id) ?? new Set();
    const visibleBullets: { id: string; text: string }[] = [];
    for (const bullet of exp.bullets) {
      for (const v of bullet.variants) {
        if (variantIds.has(v.id)) {
          visibleBullets.push({ id: v.id, text: v.text });
        }
      }
    }

    const last = groups[groups.length - 1];
    if (last && last.company === exp.companyName) {
      last.positions.push({ exp, visibleBullets });
      // Update date range to span first to last position
      const allExps = last.positions.map(p => p.exp);
      const earliest = allExps[allExps.length - 1];
      const latest = allExps[0];
      last.dateRange = formatDateRange(earliest.startDate, latest.endDate);
    } else {
      groups.push({
        company: exp.companyName,
        dateRange: formatDateRange(exp.startDate, exp.endDate),
        positions: [{ exp, visibleBullets }]
      });
    }
  }

  return groups;
}

export function ResumePreview({
  profile,
  headlines,
  selectedHeadlineId,
  experiences,
  visibleBulletVariantIds,
  educations,
  visibleEducationIds,
  onEditPersonalInfo,
  onSwapHeadline,
  onEditCompany,
  onToggleEducation
}: ResumePreviewProps) {
  const headline = headlines.find(h => h.id === selectedHeadlineId);
  const companyGroups = groupByCompany(experiences, visibleBulletVariantIds);

  const handleEditCompany = useCallback((company: string) => () => onEditCompany(company), [onEditCompany]);

  return (
    <div className="max-w-[680px] mx-auto px-10 py-8">
      {/* ── Personal info header ─────────────────────────────────── */}
      <div className="mb-1 group/header">
        <div className="flex justify-between items-start">
          <h1 className="text-[26px] font-light text-[#333]" style={{ fontFamily: 'Raleway, sans-serif' }}>
            {profile.firstName} {profile.lastName}
          </h1>
          <button
            type="button"
            onClick={onEditPersonalInfo}
            className="opacity-0 group-hover/header:opacity-30 hover:!opacity-60 transition-opacity border border-[#ddd] rounded p-1.5 cursor-pointer"
            title="Edit personal info"
          >
            <Pencil className="w-3.5 h-3.5 text-[#666]" />
          </button>
        </div>
        <ContactIconRow
          linkedin={extractHandle(profile.linkedinUrl)}
          email={profile.email}
          phone={profile.phone ?? ''}
          location={profile.location ?? ''}
          github={extractHandle(profile.githubUrl)}
        />
      </div>

      {/* ── Headline ─────────────────────────────────────────────── */}
      {headline && (
        <div className="mt-3 pt-2 border-t border-[#e5e7eb] group/headline">
          <div className="flex justify-between items-start">
            <p className="text-[12px] text-[#444] italic leading-relaxed flex-1">{headline.summaryText}</p>
            <button
              type="button"
              onClick={onSwapHeadline}
              className="opacity-0 group-hover/headline:opacity-30 hover:!opacity-60 transition-opacity ml-3 cursor-pointer shrink-0"
              title="Swap headline"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#666]" />
            </button>
          </div>
        </div>
      )}

      {/* ── Experience ───────────────────────────────────────────── */}
      <div className="mt-5">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#333] border-b-[1.5px] border-[#333] pb-0.5 mb-3">
          Experience
        </h2>

        {companyGroups.map(group => (
          <div key={group.company} className="mb-4 relative group/company">
            <button
              type="button"
              onClick={handleEditCompany(group.company)}
              className="absolute top-0 right-0 opacity-0 group-hover/company:opacity-30 hover:!opacity-60 transition-opacity cursor-pointer"
              title="Edit experience"
            >
              <Pencil className="w-3.5 h-3.5 text-[#666]" />
            </button>

            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-bold text-[#111]">{group.company}</span>
              <span className="text-[11px] text-[#666]">{group.dateRange}</span>
            </div>

            {group.positions.map(({ exp, visibleBullets }) => (
              <div key={exp.id} className="mt-2">
                {group.positions.length > 1 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] font-semibold text-[#222]">{exp.title}</span>
                    <span className="text-[10px] text-[#888]">{formatDateRange(exp.startDate, exp.endDate)}</span>
                  </div>
                )}
                {group.positions.length === 1 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-[12px] font-semibold text-[#222]">{exp.title}</span>
                  </div>
                )}
                {exp.summary && <p className="text-[11px] italic text-[#555] mt-0.5">{exp.summary}</p>}
                {visibleBullets.length > 0 && (
                  <div className="mt-1">
                    {visibleBullets.map(b => (
                      <div key={b.id} className="flex items-start py-0.5 text-[11px] text-[#333]">
                        <span className="mr-1.5 shrink-0">•</span>
                        <span>{b.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Education ────────────────────────────────────────────── */}
      {educations.length > 0 && (
        <div className="mt-5">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#333] border-b-[1.5px] border-[#333] pb-0.5 mb-2.5">
            Education
          </h2>

          {educations.map(edu => {
            const isVisible = visibleEducationIds.has(edu.id);
            return (
              <div
                key={edu.id}
                className={`flex items-baseline text-[11px] py-0.5 group/edu ${!isVisible ? 'line-through text-[#aaa]' : ''}`}
              >
                <span className="flex-1">
                  <strong>{edu.degreeTitle}</strong> — {edu.institutionName}
                  {edu.location ? `, ${edu.location}` : ''}
                </span>
                <span className={`mx-2 ${!isVisible ? 'text-[#bbb]' : 'text-[#666]'}`}>{edu.graduationYear}</span>
                <button
                  type="button"
                  onClick={() => onToggleEducation(edu.id)}
                  className="opacity-0 group-hover/edu:opacity-50 hover:!opacity-80 transition-opacity cursor-pointer shrink-0"
                  title={isVisible ? 'Exclude from resume' : 'Include in resume'}
                >
                  {isVisible ? (
                    <Eye className="w-3.5 h-3.5 text-[#666]" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-[#999]" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
