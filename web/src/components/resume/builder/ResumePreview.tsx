import { Eye, EyeOff, Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
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

type PositionEntry = {
  exp: Experience;
  visible: boolean;
  visibleBullets: { id: string; text: string }[];
};

type CompanyGroup = {
  company: string;
  dateRange: string;
  hasAnyVisible: boolean;
  positions: PositionEntry[];
};

type ResumePreviewProps = {
  profile: Profile;
  headlineText: string;
  experiences: Experience[];
  visibleBulletIds: Map<string, Set<string>>;
  educations: Education[];
  visibleEducationIds: Set<string>;
  onEditPersonalInfo: () => void;
  onEditHeadline: () => void;
  onEditCompany: (company: string) => void;
  onToggleEducation: (id: string) => void;
  onAddExperience: () => void;
  onEditEducation: (edu: Education) => void;
  onAddEducation: () => void;
};

const SECTION =
  'w-full text-left appearance-none bg-transparent border-0 p-0 font-inherit cursor-pointer rounded-lg transition-all duration-200 ease-out -mx-3 px-3 -my-1 py-1 border-l-[3px] border-l-transparent hover:border-l-[var(--section-accent)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] hover:bg-[var(--section-hover)] hover:scale-[1.005] hover:-translate-y-[1px] focus-visible:outline-2 focus-visible:outline-primary/30';

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

/** Group consecutive experiences by company, preserving date order for both visible and hidden. */
function groupByCompany(experiences: Experience[], visibleBulletIds: Map<string, Set<string>>): CompanyGroup[] {
  const groups: CompanyGroup[] = [];

  for (const exp of experiences) {
    const bulletIds = visibleBulletIds.get(exp.id) ?? new Set();
    const isVisible = bulletIds.size > 0;
    const visibleBullets: { id: string; text: string }[] = [];
    if (isVisible) {
      for (const bullet of exp.bullets) {
        if (bulletIds.has(bullet.id)) {
          visibleBullets.push({ id: bullet.id, text: bullet.content });
        }
      }
    }

    const last = groups[groups.length - 1];
    if (last && last.company === exp.companyName) {
      last.positions.push({ exp, visible: isVisible, visibleBullets });
      if (isVisible) last.hasAnyVisible = true;
      const allExps = last.positions.map(p => p.exp);
      const earliest = allExps[allExps.length - 1];
      const latest = allExps[0];
      last.dateRange = formatDateRange(earliest.startDate, latest.endDate);
    } else {
      groups.push({
        company: exp.companyName,
        dateRange: formatDateRange(exp.startDate, exp.endDate),
        hasAnyVisible: isVisible,
        positions: [{ exp, visible: isVisible, visibleBullets }]
      });
    }
  }

  return groups;
}

export function ResumePreview({
  profile,
  headlineText,
  experiences,
  visibleBulletIds,
  educations,
  visibleEducationIds,
  onEditPersonalInfo,
  onEditHeadline,
  onEditCompany,
  onAddExperience,
  onToggleEducation,
  onEditEducation,
  onAddEducation
}: ResumePreviewProps) {
  const companyGroups = useMemo(() => groupByCompany(experiences, visibleBulletIds), [experiences, visibleBulletIds]);

  const handleEditCompany = useCallback((company: string) => () => onEditCompany(company), [onEditCompany]);

  return (
    <div className="max-w-[680px] mx-auto px-10 py-8">
      {/* ── Personal info header ─────────────────────────────────── */}
      <button type="button" className={`mb-1 block ${SECTION}`} onClick={onEditPersonalInfo}>
        <h1 className="text-[26px] font-light text-[#333]" style={{ fontFamily: 'Raleway, sans-serif' }}>
          {profile.firstName} {profile.lastName}
        </h1>
        <ContactIconRow
          linkedin={extractHandle(profile.linkedinUrl)}
          email={profile.email}
          phone={profile.phone ?? ''}
          location={profile.location ?? ''}
          github={extractHandle(profile.githubUrl)}
        />
      </button>

      {/* ── Headline ─────────────────────────────────────────────── */}
      <button type="button" className={`mt-3 pt-2 border-t border-[#e5e7eb] block ${SECTION}`} onClick={onEditHeadline}>
        <p className="text-[12px] text-[#444] italic leading-relaxed">{headlineText || 'Click to add a headline...'}</p>
      </button>

      {/* ── Experience ───────────────────────────────────────────── */}
      <div className="mt-5">
        <div className="flex items-center justify-between border-b-[1.5px] border-[#333] pb-0.5 mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#333]">Experience</h2>
          <button
            type="button"
            onClick={onAddExperience}
            className="p-0.5 rounded cursor-pointer text-[#999] hover:text-[#333] transition-colors"
            title="Add experience"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {companyGroups.map(group => (
          <button
            type="button"
            key={group.company}
            className={`mb-4 block ${group.hasAnyVisible ? '' : 'text-[#aaa]'} ${SECTION}`}
            onClick={handleEditCompany(group.company)}
          >
            <div className="flex justify-between items-baseline">
              <span className={`text-[13px] font-bold ${group.hasAnyVisible ? 'text-[#111]' : ''}`}>
                {group.company}
              </span>
              <span className={`text-[11px] ${group.hasAnyVisible ? 'text-[#666]' : ''}`}>{group.dateRange}</span>
            </div>

            {group.positions.map(({ exp, visible, visibleBullets }) => (
              <div key={exp.id} className={`mt-2 ${!visible ? 'text-[#aaa]' : ''}`}>
                {group.positions.length > 1 ? (
                  <div className="flex justify-between items-baseline">
                    <span className={`text-[12px] font-semibold ${visible ? 'text-[#222]' : ''}`}>{exp.title}</span>
                    <span className={`text-[10px] ${visible ? 'text-[#888]' : ''}`}>
                      {formatDateRange(exp.startDate, exp.endDate)}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-baseline">
                    <span className={`text-[12px] font-semibold ${visible ? 'text-[#222]' : ''}`}>{exp.title}</span>
                  </div>
                )}
                {visible && exp.summary && <p className="text-[11px] italic text-[#555] mt-0.5">{exp.summary}</p>}
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
          </button>
        ))}
      </div>

      {/* ── Education ────────────────────────────────────────────── */}
      <div className="mt-5">
        <div className="flex items-center justify-between border-b-[1.5px] border-[#333] pb-0.5 mb-2.5">
          <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#333]">Education</h2>
          <button
            type="button"
            onClick={onAddEducation}
            className="p-0.5 rounded cursor-pointer text-[#999] hover:text-[#333] transition-colors"
            title="Add education"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {educations.map(edu => {
          const isVisible = visibleEducationIds.has(edu.id);
          return (
            <div key={edu.id} className={`flex items-center gap-1 group/edu ${SECTION}`}>
              <button
                type="button"
                className={`flex-1 flex items-baseline text-[11px] py-0.5 text-left bg-transparent border-0 p-0 font-inherit cursor-pointer ${!isVisible ? 'line-through text-[#aaa]' : ''}`}
                onClick={() => onEditEducation(edu)}
              >
                <span className="flex-1">
                  <strong>{edu.degreeTitle}</strong> — {edu.institutionName}
                  {edu.location ? `, ${edu.location}` : ''}
                </span>
                <span className={`mx-2 ${!isVisible ? 'text-[#bbb]' : 'text-[#666]'}`}>{edu.graduationYear}</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleEducation(edu.id)}
                className="p-0.5 rounded cursor-pointer opacity-0 group-hover/edu:opacity-60 hover:!opacity-100 transition-opacity shrink-0"
                title={isVisible ? 'Hide from resume' : 'Show on resume'}
              >
                {isVisible ? <Eye className="w-3 h-3 text-[#666]" /> : <EyeOff className="w-3 h-3 text-[#aaa]" />}
              </button>
            </div>
          );
        })}

        {educations.length === 0 && (
          <button
            type="button"
            onClick={onAddEducation}
            className="text-[11px] text-[#999] italic cursor-pointer bg-transparent border-0 p-0 hover:text-[#666] transition-colors"
          >
            Click to add education...
          </button>
        )}
      </div>
    </div>
  );
}
