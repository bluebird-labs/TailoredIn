import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type Education,
  useCreateEducation,
  useDeleteEducation,
  useEducations,
  useUpdateEducation
} from '@/hooks/use-educations';
import { useProfile } from '@/hooks/use-profile';

export function EducationList() {
  const { data: educations = [], isLoading } = useEducations();
  const { data: profile } = useProfile();
  const createEducation = useCreateEducation();
  const [adding, setAdding] = useState(false);
  const [newDegreeTitle, setNewDegreeTitle] = useState('');
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [newGraduationYear, setNewGraduationYear] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newHonors, setNewHonors] = useState('');

  function resetForm() {
    setNewDegreeTitle('');
    setNewInstitutionName('');
    setNewGraduationYear('');
    setNewLocation('');
    setNewHonors('');
  }

  function handleAdd() {
    if (!newInstitutionName.trim()) {
      toast.error('Institution name is required');
      return;
    }
    if (!newDegreeTitle.trim()) {
      toast.error('Degree title is required');
      return;
    }
    const year = Number.parseInt(newGraduationYear, 10);
    if (Number.isNaN(year)) {
      toast.error('Valid graduation year is required');
      return;
    }
    if (!profile?.id) {
      toast.error('Profile not loaded');
      return;
    }
    createEducation.mutate(
      {
        degree_title: newDegreeTitle.trim(),
        institution_name: newInstitutionName.trim(),
        graduation_year: year,
        location: newLocation.trim() || null,
        honors: newHonors.trim() || null,
        ordinal: (educations as Education[]).length
      },
      {
        onSuccess: () => {
          setAdding(false);
          resetForm();
        },
        onError: () => toast.error('Failed to create education')
      }
    );
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      {(educations as Education[]).map(edu => (
        <EducationCard key={edu.id} education={edu} />
      ))}

      {adding ? (
        <div className="border border-primary/30 rounded-lg p-3 space-y-2">
          <Input
            value={newInstitutionName}
            onChange={e => setNewInstitutionName(e.target.value)}
            placeholder="Institution name (e.g. MIT)"
            className="text-sm"
          />
          <Input
            value={newDegreeTitle}
            onChange={e => setNewDegreeTitle(e.target.value)}
            placeholder="Degree title (e.g. B.S. Computer Science)"
            className="text-sm"
          />
          <div className="flex gap-2">
            <Input
              value={newGraduationYear}
              onChange={e => setNewGraduationYear(e.target.value)}
              placeholder="Graduation year"
              className="text-sm w-32"
              type="number"
            />
            <Input
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              placeholder="Location (optional)"
              className="text-sm flex-1"
            />
          </div>
          <Input
            value={newHonors}
            onChange={e => setNewHonors(e.target.value)}
            placeholder="Honors (optional, e.g. Magna Cum Laude)"
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createEducation.isPending}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAdding(true)}>
          <Plus className="h-3 w-3 mr-1" />
          Add education
        </Button>
      )}
    </div>
  );
}

function EducationCard({ education }: { education: Education }) {
  const [editing, setEditing] = useState(false);
  const [degreeTitle, setDegreeTitle] = useState(education.degreeTitle);
  const [institutionName, setInstitutionName] = useState(education.institutionName);
  const [graduationYear, setGraduationYear] = useState(String(education.graduationYear));
  const [location, setLocation] = useState(education.location ?? '');
  const [honors, setHonors] = useState(education.honors ?? '');
  const update = useUpdateEducation();
  const del = useDeleteEducation();

  function handleSave() {
    const year = Number.parseInt(graduationYear, 10);
    if (Number.isNaN(year)) {
      toast.error('Valid graduation year is required');
      return;
    }
    update.mutate(
      {
        id: education.id,
        degree_title: degreeTitle,
        institution_name: institutionName,
        graduation_year: year,
        location: location.trim() || null,
        honors: honors.trim() || null,
        ordinal: education.ordinal
      },
      {
        onSuccess: () => setEditing(false),
        onError: () => toast.error('Failed to update education')
      }
    );
  }

  if (editing) {
    return (
      <div className="border border-primary/30 rounded-lg p-3 space-y-2">
        <Input
          value={institutionName}
          onChange={e => setInstitutionName(e.target.value)}
          className="font-medium text-sm"
          placeholder="Institution name"
        />
        <Input
          value={degreeTitle}
          onChange={e => setDegreeTitle(e.target.value)}
          className="text-sm"
          placeholder="Degree title"
        />
        <div className="flex gap-2">
          <Input
            value={graduationYear}
            onChange={e => setGraduationYear(e.target.value)}
            className="text-sm w-32"
            type="number"
            placeholder="Year"
          />
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="text-sm flex-1"
            placeholder="Location (optional)"
          />
        </div>
        <Input
          value={honors}
          onChange={e => setHonors(e.target.value)}
          className="text-sm"
          placeholder="Honors (optional)"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={update.isPending}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 flex items-start justify-between gap-2 group">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{education.institutionName}</span>
          <span className="text-muted-foreground text-xs">{education.graduationYear}</span>
        </div>
        <p className="text-sm text-muted-foreground">{education.degreeTitle}</p>
        {education.honors && <p className="text-xs text-muted-foreground mt-1">{education.honors}</p>}
        {education.location && <p className="text-xs text-muted-foreground">{education.location}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive"
          onClick={() => del.mutate(education.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
