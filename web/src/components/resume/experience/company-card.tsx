import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteCompany } from '@/hooks/use-companies';
import { BulletList } from './bullet-list';
import { LocationEditor } from './location-editor';

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

type CompanyCardProps = {
  company: Company;
  onEdit: () => void;
};

export function CompanyCard({ company, onEdit }: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const deleteCompany = useDeleteCompany();

  function handleDelete() {
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast.success(`${company.companyName} deleted`);
        setShowDelete(false);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{company.companyName}</CardTitle>
            <CardDescription>
              {company.businessDomain} &middot; {company.joinedAt} &ndash; {company.leftAt}
              {company.promotedAt && ` (promoted ${company.promotedAt})`}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onEdit}>
                <Pencil className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        {expanded && (
          <CardContent>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Locations</p>
                <LocationEditor companyId={company.id} locations={company.locations} />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Bullet Points</p>
                <BulletList companyId={company.id} bullets={company.bullets} />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${company.companyName}?`}
        description="This will permanently remove the company and all its bullets and locations."
        onConfirm={handleDelete}
        isPending={deleteCompany.isPending}
      />
    </>
  );
}
