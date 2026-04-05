import { Loader2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  type Company,
  type CompanyEnrichmentResult,
  type CompanySearchResult,
  useCreateCompany,
  useEnrichCompany,
  useSearchCompanies,
  useUpdateCompany
} from '@/hooks/use-companies';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type CompanyFormState, hasErrors, type ValidationErrors, validateCompany } from '@/lib/validation.js';
import { businessTypeOptions, industryOptions, stageOptions } from './company-options.js';

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly company?: Company;
  readonly onCreated?: (company: Company) => void;
  readonly overlayClassName?: string;
}

type Step = 'search' | 'enriching' | 'form';

function emptyState(): CompanyFormState {
  return {
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    linkedinLink: '',
    businessType: '',
    industry: '',
    stage: ''
  };
}

function companyToFormState(company: Company): CompanyFormState {
  return {
    name: company.name,
    description: company.description ?? '',
    website: company.website ?? '',
    logoUrl: company.logoUrl ?? '',
    linkedinLink: company.linkedinLink ?? '',
    businessType: company.businessType ?? '',
    industry: company.industry ?? '',
    stage: company.stage ?? ''
  };
}

function enrichmentToFormState(result: CompanyEnrichmentResult): CompanyFormState {
  return {
    name: result.name ?? '',
    description: result.description ?? '',
    website: result.website ?? '',
    logoUrl: result.logoUrl ?? '',
    linkedinLink: result.linkedinLink ?? '',
    businessType: result.businessType ?? '',
    industry: result.industry ?? '',
    stage: result.stage ?? ''
  };
}

export function CompanyFormModal({ open, onOpenChange, company, onCreated, overlayClassName }: Props) {
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const searchCompanies = useSearchCompanies();
  const enrichCompany = useEnrichCompany();
  const isSaving = createCompany.isPending || updateCompany.isPending;

  const [step, setStep] = useState<Step>(isEdit ? 'form' : 'search');
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [candidates, setCandidates] = useState<CompanySearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const savedState = useMemo(() => (isEdit ? companyToFormState(company) : emptyState()), [isEdit, company]);
  const { current, setField, setFields, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<CompanyFormState>>({});

  function resetAll() {
    setStep(isEdit ? 'form' : 'search');
    setSearchName('');
    setSearchDescription('');
    setCandidates([]);
    setSelectedIndex(null);
    reset();
    setErrors({});
  }

  function handleSearch() {
    if (!searchName.trim()) return;
    searchCompanies.mutate(
      { name: searchName.trim(), description: searchDescription.trim() || undefined },
      {
        onSuccess: results => {
          setCandidates(results);
          setSelectedIndex(null);
        },
        onError: () => toast.error('Failed to search companies')
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

  function handleSave() {
    const validationErrors = validateCompany(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      name: current.name.trim(),
      description: current.description.trim() || null,
      website: current.website.trim() || null,
      logo_url: current.logoUrl.trim() || null,
      linkedin_link: current.linkedinLink.trim() || null,
      business_type: current.businessType || null,
      industry: current.industry || null,
      stage: current.stage || null
    };

    const options = {
      // biome-ignore lint/suspicious/noExplicitAny: mutation result type varies between create/update
      onSuccess: (result: any) => {
        resetAll();
        onOpenChange(false);
        toast.success(isEdit ? 'Company updated' : 'Company created');
        if (!isEdit && onCreated && result) {
          onCreated(result as Company);
        }
      },
      onError: () => toast.error(isEdit ? 'Failed to update company' : 'Failed to create company')
    };

    if (isEdit) {
      updateCompany.mutate({ id: company.id, ...payload }, options);
    } else {
      createCompany.mutate(payload, options);
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
    isSearching: searchCompanies.isPending,
    onBack: () => setStep('search')
  });

  return (
    <FormModal open={open} onOpenChange={onOpenChange} overlayClassName={overlayClassName} {...modalProps}>
      {step === 'search' && (
        <SearchStep
          searchName={searchName}
          onSearchNameChange={setSearchName}
          searchDescription={searchDescription}
          onSearchDescriptionChange={setSearchDescription}
          onSearch={handleSearch}
          isSearching={searchCompanies.isPending}
          candidates={candidates}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}

      {step === 'enriching' && <EnrichingStep candidateName={candidates[selectedIndex ?? 0]?.name ?? 'company'} />}

      {step === 'form' && (
        <FormStep
          current={current}
          setField={setField}
          isDirtyField={isDirtyField}
          errors={errors}
          isSaving={isSaving}
        />
      )}
    </FormModal>
  );
}

// --- Step Components ---

function SearchStep({
  searchName,
  onSearchNameChange,
  searchDescription,
  onSearchDescriptionChange,
  onSearch,
  isSearching,
  candidates,
  selectedIndex,
  onSelect
}: {
  searchName: string;
  onSearchNameChange: (v: string) => void;
  searchDescription: string;
  onSearchDescriptionChange: (v: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  candidates: CompanySearchResult[];
  selectedIndex: number | null;
  onSelect: (i: number) => void;
}) {
  const hasResults = candidates.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Company name</Label>
        <Input
          value={searchName}
          onChange={e => onSearchNameChange(e.target.value)}
          placeholder="e.g. Stripe"
          disabled={isSearching}
          onKeyDown={e => {
            if (e.key === 'Enter') onSearch();
          }}
        />
      </div>

      {!hasResults && (
        <div className="space-y-1.5">
          <Label>
            Description <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            value={searchDescription}
            onChange={e => onSearchDescriptionChange(e.target.value)}
            placeholder="e.g. fintech company for online payments"
            disabled={isSearching}
            rows={2}
          />
        </div>
      )}

      <Button size="sm" className="w-full" onClick={onSearch} disabled={!searchName.trim() || isSearching}>
        {isSearching ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="mr-1.5 h-3.5 w-3.5" />
        )}
        {isSearching ? 'Searching...' : 'Search'}
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
  isSaving
}: {
  current: CompanyFormState;
  setField: (key: keyof CompanyFormState, value: string) => void;
  isDirtyField: (key: keyof CompanyFormState) => boolean;
  errors: ValidationErrors<CompanyFormState>;
  isSaving: boolean;
}) {
  return (
    <>
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
          placeholder="https://linkedin.com/company/..."
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
    isSearching: boolean;
    onBack: () => void;
  }
) {
  const base = {
    title: ctx.isEdit ? 'Edit Company' : 'Add Company',
    onDiscard: ctx.onDiscard
  };

  switch (step) {
    case 'search':
      return {
        ...base,
        description: 'Find a company to add to your profile.',
        dirtyCount: ctx.selectedIndex !== null ? 1 : 0,
        isSaving: ctx.isSearching,
        savingLabel: 'Searching...',
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
