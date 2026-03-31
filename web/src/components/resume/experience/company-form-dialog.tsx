import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCompany, useUpdateCompany } from '@/hooks/use-companies';

const companySchema = z.object({
  companyName: z.string().min(1, 'Required'),
  companyMention: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  businessDomain: z.string().min(1, 'Required')
});

type CompanyFormData = z.infer<typeof companySchema>;

type Company = {
  id: string;
  companyName: string;
  companyMention: string | null;
  websiteUrl: string | null;
  businessDomain: string;
};

type CompanyFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
};

export function CompanyFormDialog({ open, onOpenChange, company }: CompanyFormDialogProps) {
  const isEditing = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: '',
      companyMention: null,
      websiteUrl: null,
      businessDomain: ''
    }
  });

  useEffect(() => {
    if (open) {
      reset(
        company
          ? {
              companyName: company.companyName,
              companyMention: company.companyMention,
              websiteUrl: company.websiteUrl,
              businessDomain: company.businessDomain
            }
          : {
              companyName: '',
              companyMention: null,
              websiteUrl: null,
              businessDomain: ''
            }
      );
    }
  }, [open, company, reset]);

  const isPending = createCompany.isPending || updateCompany.isPending;

  async function onSubmit(data: CompanyFormData) {
    if (isEditing) {
      updateCompany.mutate(
        {
          id: company.id,
          company_name: data.companyName,
          company_mention: data.companyMention || null,
          website_url: data.websiteUrl || null,
          business_domain: data.businessDomain
        },
        {
          onSuccess: () => {
            toast.success('Company updated');
            onOpenChange(false);
          }
        }
      );
    } else {
      createCompany.mutate(
        {
          company_name: data.companyName,
          company_mention: data.companyMention || null,
          website_url: data.websiteUrl || null,
          business_domain: data.businessDomain,
          locations: []
        },
        {
          onSuccess: () => {
            toast.success('Company created');
            onOpenChange(false);
          }
        }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Company' : 'Add Company'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...register('companyName')} placeholder="Acme Corp" />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="businessDomain">Business Domain</Label>
            <Input id="businessDomain" {...register('businessDomain')} placeholder="FinTech" />
            {errors.businessDomain && <p className="text-xs text-destructive">{errors.businessDomain.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyMention">Display Name (optional)</Label>
            <Input id="companyMention" {...register('companyMention')} placeholder="How it appears in bullets" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="websiteUrl">Website (optional)</Label>
            <Input id="websiteUrl" {...register('websiteUrl')} placeholder="https://acme.com" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
