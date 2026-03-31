import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

type ResumePosition = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bullets: { id: string; content: string; ordinal: number }[];
};

type Company = {
  id: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  locations: { label: string; ordinal: number }[];
  positions: ResumePosition[];
};

export type LocalPosition = {
  resumePositionId: string;
  jobTitle: string | null;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string | null;
  endDate: string | null;
  roleSummary: string | null;
  ordinal: number;
  bullets: { bulletId: string; ordinal: number }[];
};

type PositionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  position?: LocalPosition;
  onSave: (position: LocalPosition) => void;
};

const positionSchema = z.object({
  resumePositionId: z.string().min(1, 'Position is required'),
  jobTitle: z.string().nullable().default(null),
  displayCompanyName: z.string().min(1, 'Company name is required'),
  locationLabel: z.string().min(1, 'Location is required'),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  roleSummary: z.string().nullable().default(null),
  selectedBullets: z.array(z.string()).default([])
});

type PositionFormValues = z.infer<typeof positionSchema>;

export function PositionFormDialog({ open, onOpenChange, companies, position, onSave }: PositionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      resumePositionId: '',
      jobTitle: null,
      displayCompanyName: '',
      locationLabel: '',
      startDate: null,
      endDate: null,
      roleSummary: null,
      selectedBullets: []
    }
  });

  const selectedPositionId = watch('resumePositionId');

  // Find the selected position and its parent company
  const { selectedPosition, parentCompany } = useMemo(() => {
    for (const company of companies) {
      const pos = company.positions.find(p => p.id === selectedPositionId);
      if (pos) return { selectedPosition: pos, parentCompany: company };
    }
    return { selectedPosition: undefined, parentCompany: undefined };
  }, [companies, selectedPositionId]);

  const positionBullets = useMemo(
    () => [...(selectedPosition?.bullets ?? [])].sort((a, b) => a.ordinal - b.ordinal),
    [selectedPosition]
  );

  useEffect(() => {
    if (position) {
      reset({
        resumePositionId: position.resumePositionId,
        jobTitle: position.jobTitle,
        displayCompanyName: position.displayCompanyName,
        locationLabel: position.locationLabel,
        startDate: position.startDate,
        endDate: position.endDate,
        roleSummary: position.roleSummary,
        selectedBullets: position.bullets.map(b => b.bulletId)
      });
    } else {
      reset({
        resumePositionId: '',
        jobTitle: null,
        displayCompanyName: '',
        locationLabel: '',
        startDate: null,
        endDate: null,
        roleSummary: null,
        selectedBullets: []
      });
    }
  }, [position, reset]);

  // When position changes (and not editing), pre-populate fields from the resume position + parent company
  useEffect(() => {
    if (!selectedPosition || !parentCompany || position) return;
    setValue('displayCompanyName', parentCompany.companyName);
    const firstLocation = [...parentCompany.locations].sort((a, b) => a.ordinal - b.ordinal)[0];
    if (firstLocation) setValue('locationLabel', firstLocation.label);
    setValue('startDate', selectedPosition.startDate);
    setValue('endDate', selectedPosition.endDate);
    setValue('roleSummary', selectedPosition.summary);
    setValue('jobTitle', selectedPosition.title);
  }, [selectedPosition, parentCompany, position, setValue]);

  function onSubmit(values: PositionFormValues) {
    const bullets = values.selectedBullets.map((bulletId, i) => ({
      bulletId,
      ordinal: i
    }));
    onSave({
      resumePositionId: values.resumePositionId,
      jobTitle: values.jobTitle || null,
      displayCompanyName: values.displayCompanyName,
      locationLabel: values.locationLabel,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      roleSummary: values.roleSummary || null,
      ordinal: position?.ordinal ?? 0,
      bullets
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{position ? 'Edit Position' : 'Add Position'}</DialogTitle>
          <DialogDescription>
            {position ? 'Update position details.' : 'Select a position and configure overrides.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Position</Label>
            <Controller
              name="resumePositionId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!position}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c =>
                      c.positions.length > 0 ? (
                        <SelectGroup key={c.id}>
                          <SelectLabel>{c.companyName}</SelectLabel>
                          {[...c.positions]
                            .sort((a, b) => a.ordinal - b.ordinal)
                            .map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.title} ({p.startDate} - {p.endDate})
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.resumePositionId && <p className="text-sm text-destructive">{errors.resumePositionId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-title">Job Title (optional override)</Label>
              <Input id="pf-title" placeholder='e.g. "Senior Engineer"' {...register('jobTitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-company">Display Company Name</Label>
              <Input id="pf-company" {...register('displayCompanyName')} />
              {errors.displayCompanyName && (
                <p className="text-sm text-destructive">{errors.displayCompanyName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pf-location">Location</Label>
            <Input id="pf-location" placeholder='e.g. "San Francisco, CA"' {...register('locationLabel')} />
            {errors.locationLabel && <p className="text-sm text-destructive">{errors.locationLabel.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-start">Start Date (optional override)</Label>
              <Input id="pf-start" placeholder='e.g. "Jan 2020"' {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-end">End Date (optional override)</Label>
              <Input id="pf-end" placeholder='e.g. "Present"' {...register('endDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pf-summary">Role Summary (optional override)</Label>
            <textarea
              id="pf-summary"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of the role..."
              {...register('roleSummary')}
            />
          </div>

          {positionBullets.length > 0 && (
            <div className="space-y-2">
              <Label>Bullets</Label>
              <p className="text-xs text-muted-foreground">Select which bullets to include for this position.</p>
              <Controller
                name="selectedBullets"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {positionBullets.map(bullet => {
                      const checked = field.value.includes(bullet.id);
                      function toggle() {
                        if (checked) {
                          field.onChange(field.value.filter((id: string) => id !== bullet.id));
                        } else {
                          field.onChange([...field.value, bullet.id]);
                        }
                      }
                      return (
                        <div key={bullet.id} className="flex items-start gap-2">
                          <Checkbox checked={checked} onCheckedChange={toggle} className="mt-0.5" />
                          <Label className="text-sm font-normal cursor-pointer" onClick={toggle}>
                            {bullet.content}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{position ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
