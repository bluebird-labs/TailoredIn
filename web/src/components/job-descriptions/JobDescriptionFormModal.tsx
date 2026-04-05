import { FileUp, Loader2, Type } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/shared/DatePicker.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { FormModal } from '@/components/shared/FormModal.js';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDirtyTracking } from '@/hooks/use-dirty-tracking.js';
import {
  type JobDescription,
  type JobDescriptionParseResult,
  useCreateJobDescription,
  useDeleteJobDescription,
  useExtractText,
  useParseJobDescription,
  useUpdateJobDescription
} from '@/hooks/use-job-descriptions';
import {
  hasErrors,
  type JobDescriptionFormState,
  type ValidationErrors,
  validateJobDescription
} from '@/lib/validation.js';
import { currencyOptions, jobLevelOptions, locationTypeOptions } from './job-description-options.js';

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly companyId: string;
  readonly jobDescription?: JobDescription;
}

type Step = 'source' | 'parsing' | 'form';
type SourceMode = 'file' | 'text';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyState(): JobDescriptionFormState {
  return {
    title: '',
    description: '',
    url: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: '',
    level: '',
    locationType: '',
    postedAt: todayIso()
  };
}

function jdToFormState(jd: JobDescription): JobDescriptionFormState {
  return {
    title: jd.title,
    description: jd.description,
    url: str(jd.url),
    location: str(jd.location),
    salaryMin: jd.salaryRange?.min?.toString() ?? '',
    salaryMax: jd.salaryRange?.max?.toString() ?? '',
    salaryCurrency: jd.salaryRange?.currency ?? '',
    level: str(jd.level),
    locationType: str(jd.locationType),
    postedAt: toDateStr(jd.postedAt)
  };
}

function str(value: string | Date | null | undefined): string {
  if (value == null || value === 'null') return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

function toDateStr(value: string | Date | null | undefined): string {
  const s = str(value);
  if (!s) return todayIso();
  // Truncate ISO timestamps (2026-04-05T00:00:00.000Z) to date-only
  return s.length > 10 ? s.slice(0, 10) : s;
}

function parseResultToFormState(result: JobDescriptionParseResult): JobDescriptionFormState {
  return {
    title: str(result.title),
    description: str(result.description),
    url: str(result.url),
    location: str(result.location),
    salaryMin: result.salaryMin != null ? result.salaryMin.toString() : '',
    salaryMax: result.salaryMax != null ? result.salaryMax.toString() : '',
    salaryCurrency: str(result.salaryCurrency),
    level: str(result.level),
    locationType: str(result.locationType),
    postedAt: toDateStr(result.postedAt)
  };
}

export function JobDescriptionFormModal({ open, onOpenChange, companyId, jobDescription }: Props) {
  const isEdit = !!jobDescription;
  const createJd = useCreateJobDescription();
  const updateJd = useUpdateJobDescription(companyId);
  const deleteJd = useDeleteJobDescription(companyId);
  const parseJd = useParseJobDescription();
  const extractText = useExtractText();
  const isSaving = createJd.isPending || updateJd.isPending;

  const [step, setStep] = useState<Step>(isEdit ? 'form' : 'source');
  const [sourceMode, setSourceMode] = useState<SourceMode>('text');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const savedState = useMemo(() => (isEdit ? jdToFormState(jobDescription) : emptyState()), [isEdit, jobDescription]);
  const { current, setField, setFields, isDirtyField, dirtyCount, reset } = useDirtyTracking(savedState);
  const [errors, setErrors] = useState<ValidationErrors<JobDescriptionFormState>>({});

  function resetAll() {
    setStep(isEdit ? 'form' : 'source');
    setSourceMode('text');
    setPastedText('');
    setSelectedFile(null);
    setRawText(null);
    reset();
    setErrors({});
  }

  const handleParse = useCallback(() => {
    const text = sourceMode === 'text' ? pastedText : null;
    const file = sourceMode === 'file' ? selectedFile : null;

    if (!text && !file) return;

    setStep('parsing');

    if (file) {
      extractText.mutate(file, {
        onSuccess: extractedText => {
          parseJd.mutate(
            { text: extractedText },
            {
              onSuccess: result => {
                setRawText(extractedText);
                setFields(parseResultToFormState(result));
                setStep('form');
              },
              onError: () => {
                toast.error('Parsing failed — you can fill in the details manually.');
                setRawText(extractedText);
                setFields(emptyState());
                setStep('form');
              }
            }
          );
        },
        onError: () => {
          toast.error('Failed to extract text from file — try pasting the text instead.');
          setStep('source');
        }
      });
    } else if (text) {
      parseJd.mutate(
        { text },
        {
          onSuccess: result => {
            setRawText(text);
            setFields(parseResultToFormState(result));
            setStep('form');
          },
          onError: () => {
            toast.error('Parsing failed — you can fill in the details manually.');
            setRawText(text);
            setFields(emptyState());
            setStep('form');
          }
        }
      );
    }
  }, [sourceMode, pastedText, selectedFile, extractText, parseJd, setFields]);

  function handleSave() {
    const validationErrors = validateJobDescription(current);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      company_id: companyId,
      title: current.title.trim(),
      description: current.description.trim(),
      url: current.url.trim() || null,
      location: current.location.trim() || null,
      salary_min: current.salaryMin ? Number(current.salaryMin) : null,
      salary_max: current.salaryMax ? Number(current.salaryMax) : null,
      salary_currency: current.salaryCurrency || null,
      level: current.level || null,
      location_type: current.locationType || null,
      source: isEdit ? jobDescription.source : 'upload',
      posted_at: current.postedAt || null,
      raw_text: rawText
    };

    const options = {
      onSuccess: () => {
        resetAll();
        onOpenChange(false);
        toast.success(isEdit ? 'Job description updated' : 'Job description created');
      },
      onError: () => toast.error(isEdit ? 'Failed to update job description' : 'Failed to create job description')
    };

    if (isEdit) {
      updateJd.mutate({ id: jobDescription.id, ...payload }, options);
    } else {
      createJd.mutate(payload, options);
    }
  }

  function handleDelete() {
    deleteJd.mutate(jobDescription!.id, {
      onSuccess: () => {
        resetAll();
        onOpenChange(false);
        toast.success('Job description deleted');
      },
      onError: () => toast.error('Failed to delete job description')
    });
  }

  function handleDiscard() {
    resetAll();
  }

  const sourceHasInput = sourceMode === 'text' ? pastedText.trim().length > 0 : selectedFile !== null;

  const modalProps = getModalProps(step, {
    isEdit,
    dirtyCount,
    isSaving,
    onSave: handleSave,
    onDiscard: handleDiscard,
    sourceHasInput,
    onParse: handleParse,
    onBack: () => setStep('source')
  });

  return (
    <FormModal open={open} onOpenChange={onOpenChange} {...modalProps}>
      {step === 'source' && (
        <SourceStep
          sourceMode={sourceMode}
          onSourceModeChange={setSourceMode}
          pastedText={pastedText}
          onPastedTextChange={setPastedText}
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          fileInputRef={fileInputRef}
        />
      )}

      {step === 'parsing' && <ParsingStep />}

      {step === 'form' && (
        <FormStep
          current={current}
          setField={setField}
          isDirtyField={isDirtyField}
          errors={errors}
          isSaving={isSaving}
          isEdit={isEdit}
          isDeleting={deleteJd.isPending}
          onDelete={isEdit ? handleDelete : undefined}
        />
      )}
    </FormModal>
  );
}

// --- Step Components ---

function SourceStep({
  sourceMode,
  onSourceModeChange,
  pastedText,
  onPastedTextChange,
  selectedFile,
  onFileChange,
  fileInputRef
}: {
  sourceMode: SourceMode;
  onSourceModeChange: (mode: SourceMode) => void;
  pastedText: string;
  onPastedTextChange: (v: string) => void;
  selectedFile: File | null;
  onFileChange: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={sourceMode === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSourceModeChange('text')}
        >
          <Type className="h-3.5 w-3.5 mr-1.5" />
          Paste text
        </Button>
        <Button
          variant={sourceMode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSourceModeChange('file')}
        >
          <FileUp className="h-3.5 w-3.5 mr-1.5" />
          Upload file
        </Button>
      </div>

      {sourceMode === 'text' && (
        <div className="space-y-1.5">
          <Label>Job description text</Label>
          <Textarea
            value={pastedText}
            onChange={e => onPastedTextChange(e.target.value)}
            placeholder="Paste the job description here..."
            rows={10}
          />
        </div>
      )}

      {sourceMode === 'file' && (
        <div className="space-y-1.5">
          <Label>Upload a file</Label>
          <button
            type="button"
            className="w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={e => onFileChange(e.target.files?.[0] ?? null)}
            />
            <FileUp className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            {selectedFile ? (
              <p className="text-sm">{selectedFile.name}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Click to select a file</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, TXT, or Markdown</p>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ParsingStep() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Parsing job description...</p>
    </div>
  );
}

function FormStep({
  current,
  setField,
  isDirtyField,
  errors,
  isSaving,
  isEdit,
  isDeleting,
  onDelete
}: {
  current: JobDescriptionFormState;
  setField: (key: keyof JobDescriptionFormState, value: string) => void;
  isDirtyField: (key: keyof JobDescriptionFormState) => boolean;
  errors: ValidationErrors<JobDescriptionFormState>;
  isSaving: boolean;
  isEdit: boolean;
  isDeleting: boolean;
  onDelete?: () => void;
}) {
  const disabled = isSaving || isDeleting;

  return (
    <>
      <EditableField
        type="text"
        label="Title"
        required
        value={current.title}
        onChange={v => setField('title', v)}
        isDirty={isDirtyField('title')}
        error={errors.title}
        disabled={disabled}
        placeholder="e.g. Senior Software Engineer"
      />

      <EditableField
        type="textarea"
        label="Description"
        required
        value={current.description}
        onChange={v => setField('description', v)}
        isDirty={isDirtyField('description')}
        error={errors.description}
        disabled={disabled}
        placeholder="Role responsibilities and requirements..."
        rows={4}
      />

      <div className="grid grid-cols-2 gap-3">
        <EditableField
          type="text"
          label="URL"
          value={current.url}
          onChange={v => setField('url', v)}
          isDirty={isDirtyField('url')}
          disabled={disabled}
          placeholder="https://..."
        />
        <EditableField
          type="text"
          label="Location"
          value={current.location}
          onChange={v => setField('location', v)}
          isDirty={isDirtyField('location')}
          disabled={disabled}
          placeholder="e.g. San Francisco, CA"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <EditableField
          type="number"
          label="Salary Min"
          value={current.salaryMin}
          onChange={v => setField('salaryMin', v)}
          isDirty={isDirtyField('salaryMin')}
          disabled={disabled}
          placeholder="80000"
        />
        <EditableField
          type="number"
          label="Salary Max"
          value={current.salaryMax}
          onChange={v => setField('salaryMax', v)}
          isDirty={isDirtyField('salaryMax')}
          disabled={disabled}
          placeholder="120000"
        />
        <EditableField
          type="select"
          label="Currency"
          value={current.salaryCurrency}
          onChange={v => setField('salaryCurrency', v)}
          isDirty={isDirtyField('salaryCurrency')}
          disabled={disabled}
          placeholder="Select..."
          options={currencyOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <EditableField
          type="select"
          label="Level"
          value={current.level}
          onChange={v => setField('level', v)}
          isDirty={isDirtyField('level')}
          disabled={disabled}
          placeholder="Select..."
          options={jobLevelOptions}
        />
        <EditableField
          type="select"
          label="Location Type"
          value={current.locationType}
          onChange={v => setField('locationType', v)}
          isDirty={isDirtyField('locationType')}
          disabled={disabled}
          placeholder="Select..."
          options={locationTypeOptions}
        />
      </div>

      <DatePicker
        label="Posted Date"
        value={current.postedAt}
        onChange={v => setField('postedAt', v)}
        isDirty={isDirtyField('postedAt')}
        disabled={disabled}
        placeholder="Pick a date"
      />

      {isEdit && onDelete && (
        <div className="pt-2 border-t">
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={disabled}>
            {isDeleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            {isDeleting ? 'Deleting...' : 'Delete job description'}
          </Button>
        </div>
      )}
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
    sourceHasInput: boolean;
    onParse: () => void;
    onBack: () => void;
  }
) {
  const base = {
    title: ctx.isEdit ? 'Edit Job Description' : 'Add Job Description',
    onDiscard: ctx.onDiscard
  };

  switch (step) {
    case 'source':
      return {
        ...base,
        description: 'Provide a job description to parse.',
        dirtyCount: ctx.sourceHasInput ? 1 : 0,
        isSaving: false,
        onSave: ctx.onParse,
        saveLabel: 'Parse',
        saveDisabled: !ctx.sourceHasInput
      };
    case 'parsing':
      return {
        ...base,
        description: 'Extracting job details...',
        dirtyCount: 0,
        isSaving: true,
        onSave: () => {}
      };
    case 'form':
      return {
        ...base,
        description: ctx.isEdit ? 'Update the job description details.' : 'Review and complete the parsed details.',
        dirtyCount: ctx.dirtyCount,
        isSaving: ctx.isSaving,
        onSave: ctx.onSave,
        backAction: ctx.isEdit ? undefined : ctx.onBack
      };
  }
}
