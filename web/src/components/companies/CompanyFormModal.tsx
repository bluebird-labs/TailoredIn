import { Loader2, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type Company,
  type CompanyDiscoveryResult,
  type CompanyEnrichmentResult,
  useCreateCompany,
  useDiscoverCompanies,
  useEnrichCompany,
  useUpdateCompany
} from '@/hooks/use-companies';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type CompanyFormState, hasErrors, type ValidationErrors, validateCompany } from '@/lib/validation.js';
import { businessTypeOptions, industryOptions, stageOptions, statusOptions } from './company-options.js';

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly company?: Company;
  readonly onCreated?: (company: Company) => void;
  readonly overlayClassName?: string;
}

type Step = 'discovery' | 'enriching' | 'form';

function emptyState(): CompanyFormState {
  return {
    name: '',
    domainName: '',
    description: '',
    website: '',
    logoUrl: '',
    linkedinLink: '',
    businessType: '',
    industry: '',
    stage: '',
    status: ''
  };
}

function companyToFormState(company: Company): CompanyFormState {
  return {
    name: company.name,
    domainName: company.domainName,
    description: company.description ?? '',
    website: company.website ?? '',
    logoUrl: company.logoUrl ?? '',
    linkedinLink: company.linkedinLink ?? '',
    businessType: company.businessType ?? '',
    industry: company.industry ?? '',
    stage: company.stage ?? '',
    status: company.status ?? ''
  };
}

function extractDomain(url: string | null): string {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/[:/?#].*$/, '');
}

function enrichmentToFormState(result: CompanyEnrichmentResult): CompanyFormState {
  return {
    name: result.name ?? '',
    domainName: extractDomain(result.website),
    description: result.description ?? '',
    website: result.website ?? '',
    logoUrl: result.logoUrl ?? '',
    linkedinLink: result.linkedinLink ?? '',
    businessType: result.businessType ?? '',
    industry: result.industry ?? '',
    stage: result.stage ?? '',
    status: result.status ?? ''
  };
}

export function CompanyFormModal({ open, onOpenChange, company, onCreated, overlayClassName }: Props) {
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const discoverCompanies = useDiscoverCompanies();
  const enrichCompany = useEnrichCompany();
  const isSaving = createCompany.isPending || updateCompany.isPending;

  const [step, setStep] = useState<Step>(isEdit ? 'form' : 'discovery');
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [candidates, setCandidates] = useState<CompanyDiscoveryResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const savedState = useMemo(() => (isEdit ? companyToFormState(company) : emptyState()), [isEdit, company]);
  const { current, setField, setFields, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<CompanyFormState>>({});

  function resetAll() {
    setStep(isEdit ? 'form' : 'discovery');
    setDiscoveryQuery('');
    setCandidates([]);
    setSelectedIndex(null);
    reset();
    setErrors({});
  }

  function handleDiscover() {
    if (!discoveryQuery.trim()) return;
    discoverCompanies.mutate(
      { query: discoveryQuery.trim() },
      {
        onSuccess: results => {
          setCandidates(results);
          setSelectedIndex(null);
        },
        onError: () => toast.error('Failed to discover companies')
      }
    );
  }

  function handleEnrich() {
    if (selectedIndex === null) return;
    const candidate = candidates[selectedIndex];
    const url = candidate.website;
    if (!url) {
      setFields({ ...emptyState(), name: candidate.name });
      setStep('form');
      return;
    }

    setStep('enriching');
    enrichCompany.mutate(
      { url, context: candidate.name },
      {
        onSuccess: result => {
          const formState = enrichmentToFormState(result);
          if (!formState.name && candidate.name) {
            formState.name = candidate.name;
          }
          setFields(formState);
          setStep('form');
        },
        onError: () => {
          toast.error('Enrichment failed — you can fill in the details manually.');
          setFields({ ...emptyState(), name: candidate.name, website: url });
          setStep('form');
        }
      }
    );
  }

  function handleReenrich() {
    const url = current.website.trim() || company?.website;
    if (!url) return;

    setStep('enriching');
    enrichCompany.mutate(
      { url, context: current.name || company?.name },
      {
        onSuccess: result => {
          setFields(enrichmentToFormState(result));
          setStep('form');
        },
        onError: () => {
          toast.error('Re-enrichment failed — your changes are preserved.');
          setStep('form');
        }
      }
    );
  }

  function handleSave() {
    const validationErrors = validateCompany(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      name: current.name.trim(),
      domain_name: current.domainName.trim(),
      description: current.description.trim() || null,
      website: current.website.trim() || null,
      logo_url: current.logoUrl.trim() || null,
      linkedin_link: current.linkedinLink.trim() || null,
      business_type: current.businessType || undefined,
      industry: current.industry || undefined,
      stage: current.stage || undefined,
      status: current.status || undefined
    };

    const onSaveSuccess = (result?: Company) => {
      resetAll();
      onOpenChange(false);
      toast.success(isEdit ? 'Company updated' : 'Company created');
      if (!isEdit && onCreated && result) {
        onCreated(result);
      }
    };

    if (isEdit) {
      updateCompany.mutate(
        { id: company.id, ...payload },
        {
          onSuccess: () => onSaveSuccess(),
          onError: () => toast.error('Failed to update company')
        }
      );
    } else {
      createCompany.mutate(payload, {
        onSuccess: result => onSaveSuccess(result as Company),
        onError: () => toast.error('Failed to create company')
      });
    }
  }

  function handleDiscard() {
    resetAll();
  }

  const modalProps = getModalProps(step, {
    isEdit,
    dirtyCount,
    isSaving,
    onSave: handleSave,
    onDiscard: handleDiscard,
    selectedIndex,
    onEnrich: handleEnrich,
    isDiscovering: discoverCompanies.isPending,
    onBack: () => setStep('discovery')
  });

  return (
    <FormModal open={open} onOpenChange={onOpenChange} overlayClassName={overlayClassName} {...modalProps}>
      {step === 'discovery' && (
        <DiscoveryStep
          query={discoveryQuery}
          onQueryChange={setDiscoveryQuery}
          onDiscover={handleDiscover}
          isDiscovering={discoverCompanies.isPending}
          candidates={candidates}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}

      {step === 'enriching' && (
        <EnrichingStep
          candidateName={candidates[selectedIndex ?? 0]?.name ?? (current.name || company?.name) ?? 'company'}
        />
      )}

      {step === 'form' && (
        <FormStep
          current={current}
          setField={setField}
          isDirtyField={isDirtyField}
          errors={errors}
          isSaving={isSaving}
          onReenrich={isEdit && (current.website.trim() || company?.website) ? handleReenrich : undefined}
        />
      )}
    </FormModal>
  );
}

// --- Step Components ---

function DiscoveryStep({
  query,
  onQueryChange,
  onDiscover,
  isDiscovering,
  candidates,
  selectedIndex,
  onSelect
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onDiscover: () => void;
  isDiscovering: boolean;
  candidates: CompanyDiscoveryResult[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  const hasResults = candidates.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Company name or website URL</Label>
        <Input
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="e.g. Stripe or https://stripe.com"
          disabled={isDiscovering}
          onKeyDown={e => {
            if (e.key === 'Enter') onDiscover();
          }}
        />
      </div>

      <Button size="sm" className="w-full" onClick={onDiscover} disabled={!query.trim() || isDiscovering}>
        {isDiscovering ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isDiscovering ? 'Discovering...' : 'Discover'}
      </Button>

      {hasResults && (
        <div className="space-y-1.5">
          <Label>Select the right company</Label>
          <div className="space-y-1">
            {candidates.map((candidate, i) => (
              <button
                type="button"
                key={`${candidate.name}-${candidate.website}`}
                onClick={() => onSelect(i)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedIndex === i ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{candidate.name}</span>
                  {candidate.website && <span className="text-xs text-muted-foreground">{candidate.website}</span>}
                </div>
                {candidate.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{candidate.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EnrichingStep({ candidateName }: { candidateName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Gathering details for {candidateName}...</p>
    </div>
  );
}

function FormStep({
  current,
  setField,
  isDirtyField,
  errors,
  isSaving,
  onReenrich
}: {
  current: CompanyFormState;
  setField: (key: keyof CompanyFormState, value: string) => void;
  isDirtyField: (key: keyof CompanyFormState) => boolean;
  errors: ValidationErrors<CompanyFormState>;
  isSaving: boolean;
  onReenrich?: () => void;
}) {
  return (
    <>
      {onReenrich && (
        <Button variant="outline" size="sm" onClick={onReenrich} disabled={isSaving}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Re-enrich
        </Button>
      )}

      {current.logoUrl && (
        <div className="flex justify-center">
          <img
            src={current.logoUrl}
            alt="Company logo"
            className="h-12 w-12 rounded object-contain"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <EditableField
        type="text"
        label="Company Name"
        required
        value={current.name}
        onChange={v => setField('name', v)}
        isDirty={isDirtyField('name')}
        error={errors.name}
        disabled={isSaving}
        placeholder="e.g. Acme Corp"
      />

      <EditableField
        type="text"
        label="Domain Name"
        required
        value={current.domainName}
        onChange={v => setField('domainName', v)}
        isDirty={isDirtyField('domainName')}
        error={errors.domainName}
        disabled={isSaving}
        placeholder="e.g. acme.com"
      />

      <EditableField
        type="textarea"
        label="Description"
        value={current.description}
        onChange={v => setField('description', v)}
        isDirty={isDirtyField('description')}
        disabled={isSaving}
        placeholder="What does this company do?"
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <EditableField
          type="text"
          label="Website"
          value={current.website}
          onChange={v => setField('website', v)}
          isDirty={isDirtyField('website')}
          disabled={isSaving}
          placeholder="https://..."
        />
        <EditableField
          type="text"
          label="LinkedIn"
          value={current.linkedinLink}
          onChange={v => setField('linkedinLink', v)}
          isDirty={isDirtyField('linkedinLink')}
          disabled={isSaving}
          placeholder="https://www.linkedin.com/company/..."
        />
      </div>

      <EditableField
        type="text"
        label="Logo URL"
        value={current.logoUrl}
        onChange={v => setField('logoUrl', v)}
        isDirty={isDirtyField('logoUrl')}
        disabled={isSaving}
        placeholder="https://..."
      />

      <div className="grid grid-cols-3 gap-3">
        <EditableField
          type="select"
          label="Business Type"
          value={current.businessType}
          onChange={v => setField('businessType', v)}
          isDirty={isDirtyField('businessType')}
          disabled={isSaving}
          placeholder="Select..."
          options={businessTypeOptions}
        />
        <EditableField
          type="select"
          label="Industry"
          value={current.industry}
          onChange={v => setField('industry', v)}
          isDirty={isDirtyField('industry')}
          disabled={isSaving}
          placeholder="Select..."
          options={industryOptions}
        />
        <EditableField
          type="select"
          label="Stage"
          value={current.stage}
          onChange={v => setField('stage', v)}
          isDirty={isDirtyField('stage')}
          disabled={isSaving}
          placeholder="Select..."
          options={stageOptions}
        />
      </div>

      <EditableField
        type="select"
        label="Status"
        value={current.status}
        onChange={v => setField('status', v)}
        isDirty={isDirtyField('status')}
        disabled={isSaving}
        placeholder="Select..."
        options={statusOptions}
      />
    </>
  );
}

// --- Modal Props Helper ---

function getModalProps(
  step: Step,
  ctx: {
    isEdit: boolean;
    dirtyCount: number;
    isSaving: boolean;
    onSave: () => void;
    onDiscard: () => void;
    selectedIndex: number | null;
    onEnrich: () => void;
    isDiscovering: boolean;
    onBack: () => void;
  }
) {
  const base = {
    title: ctx.isEdit ? 'Edit Company' : 'Add Company',
    onDiscard: ctx.onDiscard
  };

  switch (step) {
    case 'discovery':
      return {
        ...base,
        description: 'Find a company to add to your profile.',
        dirtyCount: ctx.selectedIndex !== null ? 1 : 0,
        isSaving: ctx.isDiscovering,
        savingLabel: 'Discovering...',
        onSave: ctx.onEnrich,
        saveLabel: 'Next',
        saveDisabled: ctx.selectedIndex === null
      };
    case 'enriching':
      return {
        ...base,
        description: 'Looking up company details...',
        dirtyCount: 0,
        isSaving: true,
        onSave: () => {}
      };
    case 'form':
      return {
        ...base,
        description: ctx.isEdit ? 'Update the company details.' : 'Review and complete the company details.',
        dirtyCount: ctx.dirtyCount,
        isSaving: ctx.isSaving,
        onSave: ctx.onSave,
        backAction: ctx.isEdit ? undefined : ctx.onBack
      };
  }
}
