import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useArchetypes, useCreateArchetype, useDeleteArchetype, useUpdateArchetype } from '@/hooks/use-archetypes';

export const Route = createFileRoute('/archetypes/')({ component: ArchetypesPage });

const archetypeSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required')
});

type ArchetypeFormValues = z.infer<typeof archetypeSchema>;
type Archetype = { id: string; key: string; label: string; headlineId: string | null };

function ArchetypesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<Archetype | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Archetype | null>(null);

  const { data: archetypes = [], isLoading } = useArchetypes();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ArchetypeFormValues>({
    resolver: zodResolver(archetypeSchema),
    defaultValues: { key: '', label: '' }
  });

  useEffect(() => {
    if (editingArchetype) {
      reset({ key: editingArchetype.key, label: editingArchetype.label });
    } else {
      reset({ key: '', label: '' });
    }
  }, [editingArchetype, reset]);

  const createMutation = useCreateArchetype();
  const updateMutation = useUpdateArchetype();
  const deleteMutation = useDeleteArchetype();

  function openAdd() {
    setEditingArchetype(null);
    setDialogOpen(true);
  }
  function openEdit(a: Archetype) {
    setEditingArchetype(a);
    setDialogOpen(true);
  }

  function onSubmit(values: ArchetypeFormValues) {
    if (editingArchetype) {
      updateMutation.mutate(
        { id: editingArchetype.id, ...values },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingArchetype(null);
            toast.success('Archetype updated');
          },
          onError: () => toast.error('Failed to update archetype')
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success('Archetype created');
        },
        onError: () => toast.error('Failed to create archetype')
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Archetypes</h1>
          <p className="text-muted-foreground mt-2">Resume personas with tag profiles and content selection.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" /> Add Archetype
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Archetypes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : archetypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No archetypes yet. Add your first archetype.
                  </TableCell>
                </TableRow>
              ) : (
                (archetypes as Archetype[]).map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge variant="secondary">{a.key}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{a.label}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={<Link to="/archetypes/$archetypeId" params={{ archetypeId: a.id }} />}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(a)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingArchetype(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArchetype ? 'Edit Archetype' : 'Add Archetype'}</DialogTitle>
            <DialogDescription>
              {editingArchetype ? 'Update the archetype key and label.' : 'Create a new resume persona.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" placeholder='e.g. "fullstack-lead"' {...register('key')} />
              {errors.key && <p className="text-sm text-destructive">{errors.key.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder='e.g. "Full-Stack Lead"' {...register('label')} />
              {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.label}"`}
        description="This will remove the archetype and all its tag weights and content selection. This cannot be undone."
        onConfirm={() =>
          deleteTarget &&
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              toast.success('Archetype deleted');
            },
            onError: () => toast.error('Failed to delete archetype')
          })
        }
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
