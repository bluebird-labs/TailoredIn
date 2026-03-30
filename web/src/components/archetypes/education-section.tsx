import { arrayMove } from '@dnd-kit/sortable';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSetArchetypeEducation } from '@/hooks/use-archetypes';

type Education = {
  id: string;
  degreeTitle: string;
  institutionName: string;
  graduationYear: string;
  locationLabel: string;
  ordinal: number;
};

type EducationSelection = {
  educationId: string;
  ordinal: number;
};

type EducationSectionProps = {
  archetypeId: string;
  educationSelections: EducationSelection[];
  allEducation: Education[];
};

export function EducationSection({ archetypeId, educationSelections, allEducation }: EducationSectionProps) {
  const [selected, setSelected] = useState<EducationSelection[]>([]);
  const setEducation = useSetArchetypeEducation();

  useEffect(() => {
    setSelected([...educationSelections].sort((a, b) => a.ordinal - b.ordinal));
  }, [educationSelections]);

  const isDirty =
    JSON.stringify(selected) !== JSON.stringify([...educationSelections].sort((a, b) => a.ordinal - b.ordinal));

  function isChecked(educationId: string) {
    return selected.some(s => s.educationId === educationId);
  }

  function toggle(educationId: string) {
    if (isChecked(educationId)) {
      setSelected(prev => {
        const filtered = prev.filter(s => s.educationId !== educationId);
        return filtered.map((s, i) => ({ ...s, ordinal: i }));
      });
    } else {
      setSelected(prev => [...prev, { educationId, ordinal: prev.length }]);
    }
  }

  function handleReorder(activeId: string, overId: string) {
    setSelected(prev => {
      const oldIndex = prev.findIndex(s => s.educationId === activeId);
      const newIndex = prev.findIndex(s => s.educationId === overId);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((s, i) => ({ ...s, ordinal: i }));
    });
  }

  function handleSave() {
    setEducation.mutate(
      {
        id: archetypeId,
        selections: selected.map(s => ({ education_id: s.educationId, ordinal: s.ordinal }))
      },
      {
        onSuccess: () => toast.success('Education selections saved'),
        onError: () => toast.error('Failed to save education selections')
      }
    );
  }

  const sortedEducation = [...allEducation].sort((a, b) => a.ordinal - b.ordinal);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Education</CardTitle>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={setEducation.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {setEducation.isPending ? 'Saving...' : 'Save Education'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEducation.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No education entries found. Add some in the Education page first.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Select education entries to include in this archetype.</p>
            <div className="space-y-2">
              {sortedEducation.map(edu => (
                <div key={edu.id} className="flex items-center gap-2">
                  <Checkbox checked={isChecked(edu.id)} onCheckedChange={() => toggle(edu.id)} />
                  <Label className="font-normal cursor-pointer" onClick={() => toggle(edu.id)}>
                    {edu.degreeTitle} — {edu.institutionName} ({edu.graduationYear})
                  </Label>
                </div>
              ))}
            </div>

            {selected.length > 1 && (
              <>
                <p className="text-sm text-muted-foreground mt-4">Drag to reorder selected entries:</p>
                <SortableList items={selected.map(s => ({ id: s.educationId }))} onReorder={handleReorder}>
                  <div className="flex flex-col gap-1">
                    {selected.map(sel => {
                      const edu = allEducation.find(e => e.id === sel.educationId);
                      if (!edu) return null;
                      return (
                        <SortableItem key={sel.educationId} id={sel.educationId}>
                          <span className="text-sm">
                            {edu.degreeTitle} — {edu.institutionName}
                          </span>
                        </SortableItem>
                      );
                    })}
                  </div>
                </SortableList>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
