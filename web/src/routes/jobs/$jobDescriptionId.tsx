import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, ChevronDown, Copy, Download, Loader2, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { formatEnumLabel as formatCompanyEnumLabel } from '@/components/companies/company-options.js';
import { JobDescriptionFormModal } from '@/components/job-descriptions/JobDescriptionFormModal.js';
import { formatEnumLabel } from '@/components/job-descriptions/job-description-options.js';
import { RawTextModal } from '@/components/job-descriptions/RawTextModal.js';
import { Breadcrumb } from '@/components/shared/Breadcrumb.js';
import { DetailPageHeader, MetaBadge, MetaDot, MetaText } from '@/components/shared/DetailPageHeader.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { InfoCard, InfoRow } from '@/components/shared/InfoCard.js';
import { LinkedEntityCard } from '@/components/shared/LinkedEntityCard.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCompany } from '@/hooks/use-companies';
import {
  type JobDescription,
  useJobDescription,
  useParseJobDescription,
  useUpdateJobDescription
} from '@/hooks/use-job-descriptions';

export const Route = createFileRoute('/jobs/$jobDescriptionId')({
  component: JobDetailPage
});

function formatSalary(jd: JobDescription): string | null {
  if (!jd.salaryRange) return null;
  const { min, max, currency } = jd.salaryRange;
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadRawText(rawText: string, companyName: string | null, jobTitle: string) {
  const company = slugify(companyName || 'unknown-company');
  const title = slugify(jobTitle);
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${company}-${title}-${today}.md`;

  const blob = new Blob([rawText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function JobDetailPage() {
  const { jobDescriptionId } = Route.useParams();
  const { data: jd, isLoading } = useJobDescription(jobDescriptionId);
  const { data: company } = useCompany(jd?.companyId ?? '');
  const [editOpen, setEditOpen] = useState(false);
  const [rawTextModalOpen, setRawTextModalOpen] = useState(false);
  const parseJd = useParseJobDescription();
  const updateJd = useUpdateJobDescription(jd?.companyId ?? '');
  const isReparsing = parseJd.isPending || updateJd.isPending;

  function reparseWithText(text: string) {
    if (!jd) return;
    parseJd.mutate(
      { text },
      {
        onSuccess: result => {
          updateJd.mutate(
            {
              id: jd.id,
              company_id: jd.companyId,
              title: result.title ?? jd.title,
              description: result.description ?? jd.description,
              url: result.url ?? jd.url,
              location: result.location ?? jd.location,
              salary_min: result.salaryMin ?? jd.salaryRange?.min,
              salary_max: result.salaryMax ?? jd.salaryRange?.max,
              salary_currency: result.salaryCurrency ?? jd.salaryRange?.currency,
              level: result.level ?? jd.level,
              location_type: result.locationType ?? jd.locationType,
              source: jd.source,
              posted_at: result.postedAt ?? jd.postedAt,
              raw_text: text,
              sought_hard_skills: result.soughtHardSkills,
              sought_soft_skills: result.soughtSoftSkills
            },
            {
              onSuccess: () => {
                setRawTextModalOpen(false);
                toast.success('Job analysis regenerated');
              },
              onError: () => toast.error('Failed to save reparsed job description')
            }
          );
        },
        onError: () => toast.error('Failed to reparse job description')
      }
    );
  }

  function handleReparse() {
    if (!jd) return;
    if (jd.rawText) {
      reparseWithText(jd.rawText);
    } else {
      setRawTextModalOpen(true);
    }
  }

  if (isLoading) return <LoadingSkeleton variant="detail" />;
  if (!jd) return <EmptyState message="Job description not found." />;

  const levelLabel = formatEnumLabel('level', jd.level);
  const locationTypeLabel = formatEnumLabel('locationType', jd.locationType);
  const salary = formatSalary(jd);
  const postedAt = formatDate(jd.postedAt);
  const createdAt = formatDate(jd.createdAt);

  const companyInitial = (company?.name ?? jd.companyId).charAt(0).toUpperCase();
  const industryLabel = company ? formatCompanyEnumLabel('industry', company.industry) : null;
  const stageLabel = company ? formatCompanyEnumLabel('stage', company.stage) : null;
  const companyMeta = [industryLabel, stageLabel].filter(Boolean).join(' · ') || company?.website || 'No details';

  return (
    <div className="space-y-5">
      <Breadcrumb parentLabel="Jobs" parentTo="/jobs" current={jd.title} />

      <DetailPageHeader
        logo={
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-accent text-[22px] font-medium text-accent-foreground overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full rounded-xl object-cover" />
            ) : (
              companyInitial
            )}
          </div>
        }
        title={jd.title}
        meta={
          <>
            {company ? (
              <Link
                to="/companies/$companyId"
                params={{ companyId: jd.companyId }}
                className="text-[13px] text-primary hover:underline"
              >
                {company.name}
              </Link>
            ) : null}
            {locationTypeLabel && (
              <>
                {company && <MetaDot />}
                <MetaBadge>{locationTypeLabel}</MetaBadge>
              </>
            )}
            {levelLabel && (
              <>
                <MetaDot />
                <MetaBadge>{levelLabel}</MetaBadge>
              </>
            )}
            {salary && (
              <>
                <MetaDot />
                <MetaText>{salary}</MetaText>
              </>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleReparse} disabled={isReparsing}>
              {isReparsing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isReparsing ? 'Reparsing...' : 'Reparse'}
            </Button>
            <Link to="/atelier" search={{ job: jobDescriptionId }}>
              <Button size="sm" variant="outline">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Open in Atelier
              </Button>
            </Link>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-[1fr_280px] gap-5">
        <div className="space-y-5">
          <InfoCard label="Details">
            <InfoRow label="Level" value={levelLabel} />
            <InfoRow label="Location" value={jd.location} />
            <InfoRow label="Location Type" value={locationTypeLabel} />
            <InfoRow label="Salary" value={salary} />
            <InfoRow label="Posted" value={postedAt} />
            {jd.url && <InfoRow label="Job Posting" value="View posting" href={jd.url} />}
          </InfoCard>

          <JobAnalysisCard description={jd.description} />

          {jd.rawText && (
            <Collapsible defaultOpen={false}>
              <div className="rounded-[14px] border bg-card p-5">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger>Raw Text</CollapsibleTrigger>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Download as .md"
                    onClick={() => downloadRawText(jd.rawText!, jd.companyName, jd.title)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <CollapsiblePanel>
                  <pre className="pt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground font-sans">
                    {jd.rawText}
                  </pre>
                </CollapsiblePanel>
              </div>
            </Collapsible>
          )}
        </div>

        <div className="space-y-5">
          {company && (
            <InfoCard label="Company">
              <LinkedEntityCard
                to={`/companies/${jd.companyId}`}
                logoUrl={company.logoUrl}
                logoInitial={companyInitial}
                name={company.name}
                meta={companyMeta}
              />
            </InfoCard>
          )}

          <InfoCard label="Job Info">
            <InfoRow label="Source" value={jd.source} />
            <InfoRow label="Added" value={createdAt} />
          </InfoCard>

          <SkillsCard hardSkills={jd.soughtHardSkills} softSkills={jd.soughtSoftSkills} />
        </div>
      </div>

      {editOpen && (
        <JobDescriptionFormModal
          open
          companyId={jd.companyId}
          jobDescription={jd}
          onOpenChange={next => {
            if (!next) setEditOpen(false);
          }}
        />
      )}

      <RawTextModal
        open={rawTextModalOpen}
        onOpenChange={setRawTextModalOpen}
        onSubmit={reparseWithText}
        isProcessing={isReparsing}
      />
    </div>
  );
}

function SkillsCard({ hardSkills, softSkills }: { hardSkills: string[] | null; softSkills: string[] | null }) {
  const hasHard = hardSkills && hardSkills.length > 0;
  const hasSoft = softSkills && softSkills.length > 0;
  if (!hasHard && !hasSoft) return null;

  return (
    <InfoCard label="Skills">
      <div className="space-y-4">
        {hasHard && (
          <div>
            <div className="mb-2 text-[13px] text-muted-foreground">Hard Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {hardSkills.map(skill => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {hasSoft && (
          <div>
            <div className="mb-2 text-[13px] text-muted-foreground">Soft Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {softSkills.map(skill => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </InfoCard>
  );
}

const COLLAPSED_HEIGHT = 300;

function JobAnalysisCard({ description }: { description: string | null }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [copied, setCopied] = useState(false);

  const measureRef = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (node) {
      setNeedsCollapse(node.scrollHeight > COLLAPSED_HEIGHT + 40);
    }
  };

  const handleCopy = async () => {
    if (!description) return;
    await navigator.clipboard.writeText(description);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <InfoCard
      label="Job Analysis"
      action={
        description ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Copy to clipboard" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        ) : undefined
      }
    >
      {description ? (
        <div className="relative">
          <div
            ref={measureRef}
            className="prose prose-sm max-w-none text-[14px] leading-relaxed tracking-[0.01em] text-foreground
              [&_h3]:text-[14px] [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-1.5
              [&_h3:first-child]:mt-0
              [&_p]:my-1.5
              [&_ul]:my-1.5 [&_ul]:pl-5 [&_ul]:list-disc
              [&_li]:my-0.5 [&_li]:text-[14px]
              overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: !expanded && needsCollapse ? `${COLLAPSED_HEIGHT}px` : undefined }}
          >
            <Markdown>{description}</Markdown>
          </div>
          {needsCollapse && !expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
          {needsCollapse && (
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setExpanded(prev => !prev)}
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      ) : (
        <p className="text-[14px] italic text-muted-foreground">No description</p>
      )}
    </InfoCard>
  );
}
