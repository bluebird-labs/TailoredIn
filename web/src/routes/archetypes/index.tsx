import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { TagInput } from '@/components/shared/tag-input';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ARCHETYPE_KEY_LABELS,
  type ArchetypeKey,
  useArchetypes,
  useCreateArchetype,
  useDeleteArchetype,
  useUpdateArchetype
} from '@/hooks/use-archetypes';
import { useHeadlines } from '@/hooks/use-headlines';

export const Route = createFileRoute('/archetypes/')({
  component: ArchetypesPage
});

const ARCHETYPE_KEYS = Object.keys(ARCHETYPE_KEY_LABELS);

const archetypeSchema = z.object({
  archetypeKey: z.string().min(1, 'Archetype type is required'),
  archetypeLabel: z.string().min(1, 'Label is required'),
  archetypeDescription: z.string().nullable().default(null),
  headlineId: z.string().min(1, 'Headline is required'),
  socialNetworks: z.array(z.string()).default([])
});

type ArchetypeFormValues = z.infer<typeof archetypeSchema>;

type Archetype = {
  id: string;
  archetypeKey: string;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headlineId: string;
  socialNetworks: string[];
};

function ArchetypesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<Archetype | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Archetype | null>(null);

  const { data: archetypesResponse, isLoading } = useArchetypes();
  const { data: headlinesResponse } = useHeadlines();

  const archetypes = (archetypesResponse?.data ?? []) as Archetype[];
  const headlines = (headlinesResponse?.data ?? []) as { id: string; label: string }[];

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ArchetypeFormValues>({
    resolver: zodResolver(archetypeSchema),
    defaultValues: {
      archetypeKey: '',
      archetypeLabel: '',
      archetypeDescription: null,
      headlineId: '',
      socialNetworks: []
    }
  });

  useEffect(() => {
    if (editingArchetype) {
      reset({
        archetypeKey: editingArchetype.archetypeKey,
        archetypeLabel: editingArchetype.archetypeLabel,
        archetypeDescription: editingArchetype.archetypeDescription,
        headlineId: editingArchetype.headlineId,
        socialNetworks: editingArchetype.socialNetworks
      });
    } else {
      reset({
        archetypeKey: '',
        archetypeLabel: '',
        archetypeDescription: null,
        headlineId: '',
        socialNetworks: []
      });
    }
  }, [editingArchetype, reset]);

  const createMutation = useCreateArchetype();
  const updateMutation = useUpdateArchetype();
  const deleteMutation = useDeleteArchetype();

  function openAdd() {
    setEditingArchetype(null);
    setDialogOpen(true);
  }

  function openEdit(archetype: Archetype) {
    setEditingArchetype(archetype);
    setDialogOpen(true);
  }

  function onSubmit(values: ArchetypeFormValues) {
    if (editingArchetype) {
      updateMutation.mutate(
        {
          id: editingArchetype.id,
          archetype_label: values.archetypeLabel,
          archetype_description: values.archetypeDescription,
          headline_id: values.headlineId,
          social_networks: values.socialNetworks
        },
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
      createMutation.mutate(
        {
          archetype_key: values.archetypeKey as ArchetypeKey,
          archetype_label: values.archetypeLabel,
          archetype_description: values.archetypeDescription,
          headline_id: values.headlineId,
          social_networks: values.socialNetworks
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast.success('Archetype created');
          },
          onError: () => toast.error('Failed to create archetype')
        }
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Archetypes</h1>
          <p className="text-muted-foreground mt-2">Resume archetypes and their configurations.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Archetype
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
                <TableHead>Type</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : archetypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No archetypes yet. Add your first archetype.
                  </TableCell>
                </TableRow>
              ) : (
                archetypes.map(archetype => (
                  <TableRow key={archetype.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {ARCHETYPE_KEY_LABELS[archetype.archetypeKey] ?? archetype.archetypeKey}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{archetype.archetypeLabel}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {archetype.archetypeDescription ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          nativeButton={false}
                          render={<Link to="/archetypes/$archetypeId" params={{ archetypeId: archetype.id }} />}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(archetype)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(archetype)}>
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

      {/* Add/Edit Dialog */}
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
              {editingArchetype
                ? 'Update the archetype configuration.'
                : 'Create a new archetype for resume generation.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!editingArchetype && (
              <div className="space-y-2">
                <Label htmlFor="archetypeKey">Archetype Type</Label>
                <Controller
                  name="archetypeKey"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ARCHETYPE_KEYS.map(key => (
                          <SelectItem key={key} value={key}>
                            {ARCHETYPE_KEY_LABELS[key]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.archetypeKey && <p className="text-sm text-destructive">{errors.archetypeKey.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="archetypeLabel">Label</Label>
              <Input id="archetypeLabel" placeholder='e.g. "Full-Stack Lead"' {...register('archetypeLabel')} />
              {errors.archetypeLabel && <p className="text-sm text-destructive">{errors.archetypeLabel.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="archetypeDescription">Description</Label>
              <textarea
                id="archetypeDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Optional description..."
                {...register('archetypeDescription')}
              />
            </div>

            <div className="space-y-2">
              <Label>Headline</Label>
              <Controller
                name="headlineId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a headline..." />
                    </SelectTrigger>
                    <SelectContent>
                      {headlines.map(h => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.headlineId && <p className="text-sm text-destructive">{errors.headlineId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Social Networks</Label>
              <Controller
                name="socialNetworks"
                control={control}
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} placeholder="e.g. LinkedIn, GitHub..." />
                )}
              />
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

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.archetypeLabel}"`}
        description="Are you sure? This will remove the archetype and all its position, skill, and education selections. This action cannot be undone."
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
