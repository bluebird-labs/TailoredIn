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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Company = {
  id: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
  joinedAt: string;
  leftAt: string;
  promotedAt: string | null;
  locations: { label: string; ordinal: number }[];
  bullets: { id: string; content: string; ordinal: number }[];
};

export type LocalPosition = {
  resumeCompanyId: string;
  jobTitle: string;
  displayCompanyName: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  roleSummary: string;
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
  resumeCompanyId: z.string().min(1, 'Company is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  displayCompanyName: z.string().min(1, 'Company name is required'),
  locationLabel: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  roleSummary: z.string().default(''),
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
      resumeCompanyId: '',
      jobTitle: '',
      displayCompanyName: '',
      locationLabel: '',
      startDate: '',
      endDate: '',
      roleSummary: '',
      selectedBullets: []
    }
  });

  const selectedCompanyId = watch('resumeCompanyId');
  const selectedCompany = useMemo(
    () => companies.find(c => c.id === selectedCompanyId),
    [companies, selectedCompanyId]
  );
  const companyBullets = useMemo(
    () => [...(selectedCompany?.bullets ?? [])].sort((a, b) => a.ordinal - b.ordinal),
    [selectedCompany]
  );

  useEffect(() => {
    if (position) {
      reset({
        resumeCompanyId: position.resumeCompanyId,
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
        resumeCompanyId: '',
        jobTitle: '',
        displayCompanyName: '',
        locationLabel: '',
        startDate: '',
        endDate: '',
        roleSummary: '',
        selectedBullets: []
      });
    }
  }, [position, reset]);

  // When company changes (and not editing), pre-populate fields
  useEffect(() => {
    if (!selectedCompany || position) return;
    setValue('displayCompanyName', selectedCompany.companyName);
    const firstLocation = selectedCompany.locations.sort((a, b) => a.ordinal - b.ordinal)[0];
    if (firstLocation) setValue('locationLabel', firstLocation.label);
    setValue('startDate', selectedCompany.joinedAt);
    setValue('endDate', selectedCompany.leftAt);
  }, [selectedCompany, position, setValue]);

  function onSubmit(values: PositionFormValues) {
    const bullets = values.selectedBullets.map((bulletId, i) => ({
      bulletId,
      ordinal: i
    }));
    onSave({
      resumeCompanyId: values.resumeCompanyId,
      jobTitle: values.jobTitle,
      displayCompanyName: values.displayCompanyName,
      locationLabel: values.locationLabel,
      startDate: values.startDate,
      endDate: values.endDate,
      roleSummary: values.roleSummary,
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
            {position ? 'Update position details.' : 'Select a company and configure the position.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Company</Label>
            <Controller
              name="resumeCompanyId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!!position}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.resumeCompanyId && <p className="text-sm text-destructive">{errors.resumeCompanyId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pf-title">Job Title</Label>
              <Input id="pf-title" placeholder='e.g. "Senior Engineer"' {...register('jobTitle')} />
              {errors.jobTitle && <p className="text-sm text-destructive">{errors.jobTitle.message}</p>}
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
              <Label htmlFor="pf-start">Start Date</Label>
              <Input id="pf-start" placeholder='e.g. "Jan 2020"' {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-end">End Date</Label>
              <Input id="pf-end" placeholder='e.g. "Present"' {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pf-summary">Role Summary</Label>
            <textarea
              id="pf-summary"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Brief description of the role..."
              {...register('roleSummary')}
            />
          </div>

          {companyBullets.length > 0 && (
            <div className="space-y-2">
              <Label>Bullets</Label>
              <p className="text-xs text-muted-foreground">Select which bullets to include for this position.</p>
              <Controller
                name="selectedBullets"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {companyBullets.map(bullet => {
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
