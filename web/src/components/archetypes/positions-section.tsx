import { arrayMove } from '@dnd-kit/sortable';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { type LocalPosition, PositionFormDialog } from '@/components/archetypes/position-form-dialog';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetArchetypePositions } from '@/hooks/use-archetypes';

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

type ArchetypePosition = {
  id: string;
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

type PositionsSectionProps = {
  archetypeId: string;
  positions: ArchetypePosition[];
  companies: Company[];
};

function toLocal(p: ArchetypePosition): LocalPosition {
  return {
    resumeCompanyId: p.resumeCompanyId,
    jobTitle: p.jobTitle,
    displayCompanyName: p.displayCompanyName,
    locationLabel: p.locationLabel,
    startDate: p.startDate,
    endDate: p.endDate,
    roleSummary: p.roleSummary,
    ordinal: p.ordinal,
    bullets: [...p.bullets].sort((a, b) => a.ordinal - b.ordinal)
  };
}

export function PositionsSection({ archetypeId, positions, companies }: PositionsSectionProps) {
  const [localPositions, setLocalPositions] = useState<LocalPosition[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const setPositions = useSetArchetypePositions();

  useEffect(() => {
    setLocalPositions([...positions].sort((a, b) => a.ordinal - b.ordinal).map(toLocal));
  }, [positions]);

  const isDirty =
    JSON.stringify(localPositions) !==
    JSON.stringify([...positions].sort((a, b) => a.ordinal - b.ordinal).map(toLocal));

  function openAdd() {
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function removePosition(index: number) {
    setLocalPositions(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((p, i) => ({ ...p, ordinal: i }));
    });
  }

  function handleSavePosition(position: LocalPosition) {
    setLocalPositions(prev => {
      if (editingIndex !== null) {
        const next = [...prev];
        next[editingIndex] = { ...position, ordinal: editingIndex };
        return next;
      }
      return [...prev, { ...position, ordinal: prev.length }];
    });
  }

  function handleReorder(activeId: string, overId: string) {
    setLocalPositions(prev => {
      const oldIndex = Number.parseInt(activeId, 10);
      const newIndex = Number.parseInt(overId, 10);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((p, i) => ({ ...p, ordinal: i }));
    });
  }

  function handleSave() {
    setPositions.mutate(
      {
        id: archetypeId,
        positions: localPositions.map(p => ({
          resume_company_id: p.resumeCompanyId,
          job_title: p.jobTitle,
          display_company_name: p.displayCompanyName,
          location_label: p.locationLabel,
          start_date: p.startDate,
          end_date: p.endDate,
          role_summary: p.roleSummary,
          ordinal: p.ordinal,
          bullets: p.bullets.map(b => ({ bullet_id: b.bulletId, ordinal: b.ordinal }))
        }))
      },
      {
        onSuccess: () => toast.success('Positions saved'),
        onError: () => toast.error('Failed to save positions')
      }
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Positions</CardTitle>
        <div className="flex gap-2">
          {isDirty && (
            <Button size="sm" onClick={handleSave} disabled={setPositions.isPending}>
              <Save className="mr-1 h-4 w-4" />
              {setPositions.isPending ? 'Saving...' : 'Save Positions'}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Position
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {localPositions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No positions yet. Add a position to include on this archetype's resume.
          </p>
        ) : (
          <SortableList items={localPositions.map((_, i) => ({ id: String(i) }))} onReorder={handleReorder}>
            <div className="flex flex-col gap-2">
              {localPositions.map((pos, index) => (
                <SortableItem key={`${pos.resumeCompanyId}-${pos.jobTitle}`} id={String(index)}>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{pos.jobTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {pos.displayCompanyName} &middot; {pos.startDate} – {pos.endDate}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pos.locationLabel} &middot; {pos.bullets.length} bullet{pos.bullets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(index)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => removePosition(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableList>
        )}
      </CardContent>

      <PositionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        companies={companies}
        position={editingIndex !== null ? localPositions[editingIndex] : undefined}
        onSave={handleSavePosition}
      />
    </Card>
  );
}
