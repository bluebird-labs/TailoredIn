import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { useCreateCompany } from '@/hooks/use-companies';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import { type CompanyFormState, hasErrors, type ValidationErrors, validateCompany } from '@/lib/validation.js';
import { businessTypeOptions, industryOptions, stageOptions } from './company-options.js';

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function emptyState(): CompanyFormState {
  return {
    name: '',
    website: '',
    logoUrl: '',
    linkedinLink: '',
    businessType: '',
    industry: '',
    stage: ''
  };
}

export function CompanyFormModal({ open, onOpenChange }: Props) {
  const createCompany = useCreateCompany();
  const isSaving = createCompany.isPending;

  const savedState = useMemo(() => emptyState(), []);
  const { current, setField, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<CompanyFormState>>({});

  function handleSave() {
    const validationErrors = validateCompany(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    createCompany.mutate(
      {
        name: current.name.trim(),
        website: current.website.trim() || null,
        logo_url: current.logoUrl.trim() || null,
        linkedin_link: current.linkedinLink.trim() || null,
        business_type: current.businessType || null,
        industry: current.industry || null,
        stage: current.stage || null
      },
      {
        onSuccess: () => {
          setErrors({});
          reset();
          onOpenChange(false);
          toast.success('Company created');
        },
        onError: () => toast.error('Failed to create company')
      }
    );
  }

  function handleDiscard() {
    reset();
    setErrors({});
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Company"
      description="Add a new company to your directory."
      dirtyCount={dirtyCount}
      isSaving={isSaving}
      onSave={handleSave}
      onDiscard={handleDiscard}
    >
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
    </FormModal>
  );
}
