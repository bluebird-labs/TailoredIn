import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { useHeadlines } from '@/hooks/use-headlines';
import { useCurrentUser } from '@/hooks/use-user';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/resume/headlines')({
  component: HeadlinesPage
});

const headlineSchema = z.object({
  headlineLabel: z.string().min(1, 'Label is required'),
  summaryText: z.string().min(1, 'Summary is required')
});

type HeadlineFormValues = z.infer<typeof headlineSchema>;

type Headline = {
  id: string;
  headlineLabel: string;
  summaryText: string;
};

function HeadlinesPage() {
  const { data: userResponse } = useCurrentUser();
  const userId = userResponse?.data?.id;
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Headline | null>(null);

  const { data: headlinesResponse, isLoading } = useHeadlines(userId);

  const headlines = headlinesResponse?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HeadlineFormValues>({
    resolver: zodResolver(headlineSchema),
    defaultValues: { headlineLabel: '', summaryText: '' }
  });

  useEffect(() => {
    if (editingHeadline) {
      reset({ headlineLabel: editingHeadline.headlineLabel, summaryText: editingHeadline.summaryText });
    } else {
      reset({ headlineLabel: '', summaryText: '' });
    }
  }, [editingHeadline, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: HeadlineFormValues) => {
      return api.users({ userId: userId! }).resume.headlines.post({
        headline_label: values.headlineLabel,
        summary_text: values.summaryText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDialogOpen(false);
      toast.success('Headline created');
    },
    onError: () => {
      toast.error('Failed to create headline');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: HeadlineFormValues }) => {
      return api.users({ userId: userId! }).resume.headlines({ id }).put({
        headline_label: values.headlineLabel,
        summary_text: values.summaryText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDialogOpen(false);
      setEditingHeadline(null);
      toast.success('Headline updated');
    },
    onError: () => {
      toast.error('Failed to update headline');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.users({ userId: userId! }).resume.headlines({ id }).delete();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.headlines() });
      setDeleteTarget(null);
      toast.success('Headline deleted');
    },
    onError: () => {
      toast.error('Failed to delete headline');
    }
  });

  function openAdd() {
    setEditingHeadline(null);
    setDialogOpen(true);
  }

  function openEdit(headline: Headline) {
    setEditingHeadline(headline);
    setDialogOpen(true);
  }

  function onSubmit(values: HeadlineFormValues) {
    if (editingHeadline) {
      updateMutation.mutate({ id: editingHeadline.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Headlines</h1>
      <p className="text-muted-foreground mt-2">Resume headline and summary variations for different archetypes.</p>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Headlines</CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add Headline
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-64" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : headlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No headlines yet. Add your first headline.
                  </TableCell>
                </TableRow>
              ) : (
                headlines.map((headline: Headline) => (
                  <TableRow key={headline.id}>
                    <TableCell className="font-medium">{headline.headlineLabel}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{headline.summaryText}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(headline)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(headline)}>
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
          if (!open) setEditingHeadline(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHeadline ? 'Edit Headline' : 'Add Headline'}</DialogTitle>
            <DialogDescription>
              {editingHeadline
                ? 'Update the headline label and summary text.'
                : 'Create a new headline for your resume.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headlineLabel">Label</Label>
              <Input id="headlineLabel" placeholder='e.g. "Full-Stack Engineer"' {...register('headlineLabel')} />
              {errors.headlineLabel && <p className="text-sm text-destructive">{errors.headlineLabel.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summaryText">Summary</Label>
              <textarea
                id="summaryText"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="A brief professional summary..."
                {...register('summaryText')}
              />
              {errors.summaryText && <p className="text-sm text-destructive">{errors.summaryText.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Headline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.headlineLabel}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
