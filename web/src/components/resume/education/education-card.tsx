import { Award, GraduationCap, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Education, useDeleteEducation } from '@/hooks/use-education';

type EducationCardProps = {
  education: Education;
  onEdit: () => void;
};

export function EducationCard({ education, onEdit }: EducationCardProps) {
  const [showDelete, setShowDelete] = useState(false);
  const deleteEducation = useDeleteEducation();

  function handleDelete() {
    deleteEducation.mutate(education.id, {
      onSuccess: () => {
        toast.success(`${education.degreeTitle} deleted`);
        setShowDelete(false);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-4 text-muted-foreground" />
              {education.degreeTitle}
            </CardTitle>
            <CardDescription>
              {education.institutionName} &middot; {education.graduationYear}
              {education.location && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <MapPin className="size-3" />
                  {education.location}
                </span>
              )}
              {education.honors && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Award className="size-3" />
                  {education.honors}
                </span>
              )}
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
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
      </Card>

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={`Delete ${education.degreeTitle}?`}
        description="This education entry will be permanently removed."
        onConfirm={handleDelete}
        isPending={deleteEducation.isPending}
      />
    </>
  );
}
