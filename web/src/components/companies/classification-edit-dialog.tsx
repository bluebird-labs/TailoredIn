import { BusinessType, CompanyStage, Industry } from '@tailoredin/api/client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { formatClassificationLabel } from '@/components/companies/classification-badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateJobCompanyClassification } from '@/hooks/use-job-company';

const UNCLASSIFIED = '__unclassified__';

type ClassificationFormData = {
  businessType: string;
  industry: string;
  stage: string;
};

type ClassificationEditDialogProps = {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBusinessType: string | null;
  currentIndustry: string | null;
  currentStage: string | null;
};

function enumOptions(enumObj: Record<string, string>) {
  return Object.values(enumObj).map(value => ({
    value,
    label: formatClassificationLabel(value)
  }));
}

export function ClassificationEditDialog({
  companyId,
  open,
  onOpenChange,
  currentBusinessType,
  currentIndustry,
  currentStage
}: ClassificationEditDialogProps) {
  const mutation = useUpdateJobCompanyClassification(companyId);

  const { setValue, handleSubmit, watch, reset } = useForm<ClassificationFormData>({
    defaultValues: {
      businessType: currentBusinessType ?? UNCLASSIFIED,
      industry: currentIndustry ?? UNCLASSIFIED,
      stage: currentStage ?? UNCLASSIFIED
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        businessType: currentBusinessType ?? UNCLASSIFIED,
        industry: currentIndustry ?? UNCLASSIFIED,
        stage: currentStage ?? UNCLASSIFIED
      });
    }
  }, [open, currentBusinessType, currentIndustry, currentStage, reset]);

  const onSubmit = handleSubmit(async data => {
    try {
      await mutation.mutateAsync({
        business_type: (data.businessType === UNCLASSIFIED ? null : data.businessType) as BusinessType | null,
        industry: (data.industry === UNCLASSIFIED ? null : data.industry) as Industry | null,
        stage: (data.stage === UNCLASSIFIED ? null : data.stage) as CompanyStage | null
      });
      toast.success('Classification updated');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Classification</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Business Type</Label>
            <Select value={watch('businessType')} onValueChange={v => v !== null && setValue('businessType', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCLASSIFIED}>Unclassified</SelectItem>
                {enumOptions(BusinessType).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Industry</Label>
            <Select value={watch('industry')} onValueChange={v => v !== null && setValue('industry', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCLASSIFIED}>Unclassified</SelectItem>
                {enumOptions(Industry).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={watch('stage')} onValueChange={v => v !== null && setValue('stage', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNCLASSIFIED}>Unclassified</SelectItem>
                {enumOptions(CompanyStage).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
