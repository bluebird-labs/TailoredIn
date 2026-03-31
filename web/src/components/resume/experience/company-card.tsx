import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteCompany } from '@/hooks/use-companies';
import { useCreatePosition, useDeletePosition, useUpdatePosition } from '@/hooks/use-positions';
import { BulletList } from './bullet-list';
import { LocationEditor } from './location-editor';
import { type Position, PositionFormDialog } from './position-form-dialog';

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

type CompanyCardProps = {
  company: Company;
  onEdit: () => void;
};

export function CompanyCard({ company, onEdit }: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<ResumePosition | undefined>();
  const [deletePositionTarget, setDeletePositionTarget] = useState<ResumePosition | null>(null);
  const deleteCompany = useDeleteCompany();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const sortedPositions = [...company.positions].sort((a, b) => a.ordinal - b.ordinal);

  function handleDeleteCompany() {
    deleteCompany.mutate(company.id, {
      onSuccess: () => {
        toast.success(`${company.companyName} deleted`);
        setShowDelete(false);
      }
    });
  }

  function handleAddPosition() {
    setEditingPosition(undefined);
    setPositionDialogOpen(true);
  }

  function handleEditPosition(position: ResumePosition) {
    setEditingPosition(position);
    setPositionDialogOpen(true);
  }

  function handleSavePosition(data: { title: string; startDate: string; endDate: string; summary: string | null }) {
    if (editingPosition) {
      updatePosition.mutate(
        {
          companyId: company.id,
          positionId: editingPosition.id,
          title: data.title,
          start_date: data.startDate,
          end_date: data.endDate,
          summary: data.summary || null
        },
        {
          onSuccess: () => {
            toast.success('Position updated');
            setPositionDialogOpen(false);
          }
        }
      );
    } else {
      const ordinal = sortedPositions.length > 0 ? Math.max(...sortedPositions.map(p => p.ordinal)) + 1 : 0;
      createPosition.mutate(
        {
          companyId: company.id,
          title: data.title,
          start_date: data.startDate,
          end_date: data.endDate,
          summary: data.summary || null,
          ordinal
        },
        {
          onSuccess: () => {
            toast.success('Position added');
            setPositionDialogOpen(false);
          }
        }
      );
    }
  }

  function handleDeletePosition() {
    if (!deletePositionTarget) return;
    deletePosition.mutate(
      { companyId: company.id, positionId: deletePositionTarget.id },
      {
        onSuccess: () => {
          toast.success('Position deleted');
          setDeletePositionTarget(null);
        }
      }
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{company.companyName}</CardTitle>
            <CardDescription>{company.businessDomain}</CardDescription>
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
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Positions</p>
                  <Button variant="ghost" size="icon-xs" onClick={handleAddPosition}>
                    <Plus className="size-3" />
                  </Button>
                </div>
                {sortedPositions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No positions yet. Add one to get started.</p>
                )}
                {sortedPositions.map(position => (
                  <div key={position.id} className="mb-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{position.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {position.startDate} &ndash; {position.endDate}
                        </p>
                        {position.summary && <p className="mt-1 text-xs text-muted-foreground">{position.summary}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => handleEditPosition(position)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletePositionTarget(position)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Bullet Points</p>
                      <BulletList positionId={position.id} bullets={position.bullets} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${company.companyName}?`}
        description="This will permanently remove the company and all its positions, bullets, and locations."
        onConfirm={handleDeleteCompany}
        isPending={deleteCompany.isPending}
      />

      <ConfirmDeleteDialog
        open={!!deletePositionTarget}
        onOpenChange={open => !open && setDeletePositionTarget(null)}
        title={`Delete ${deletePositionTarget?.title ?? 'position'}?`}
        description="This will permanently remove the position and all its bullets."
        onConfirm={handleDeletePosition}
        isPending={deletePosition.isPending}
      />

      <PositionFormDialog
        open={positionDialogOpen}
        onOpenChange={setPositionDialogOpen}
        position={editingPosition as Position | undefined}
        onSave={handleSavePosition}
        isPending={createPosition.isPending || updatePosition.isPending}
      />
    </>
  );
}
