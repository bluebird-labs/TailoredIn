import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronsUpDown, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHeadlines } from '@/hooks/use-headlines';
import { useProfile } from '@/hooks/use-profile';
import { useTags } from '@/hooks/use-tags';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/resume/headlines')({
  component: HeadlinesPage
});


const headlineSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  summaryText: z.string().min(1, 'Summary is required')
});

type HeadlineFormValues = z.infer<typeof headlineSchema>;

type RoleTag = { id: string; name: string };

type Headline = {
  id: string;
  label: string;
  summaryText: string;
  roleTags: RoleTag[];
};

function HeadlinesPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHeadline, setEditingHeadline] = useState<Headline | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Headline | null>(null);
  const [selectedTags, setSelectedTags] = useState<RoleTag[]>([]);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const { data: headlinesResponse, isLoading } = useHeadlines();
  const { data: tagsResponse } = useTags('ROLE');

  const headlines = (headlinesResponse ?? []) as Headline[];
  const availableTags = (tagsResponse ?? []) as RoleTag[];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HeadlineFormValues>({
    resolver: zodResolver(headlineSchema),
    defaultValues: { label: '', summaryText: '' }
  });

  useEffect(() => {
    if (editingHeadline) {
      reset({ label: editingHeadline.label, summaryText: editingHeadline.summaryText });
      setSelectedTags(editingHeadline.roleTags ?? []);
    } else {
      reset({ label: '', summaryText: '' });
      setSelectedTags([]);
    }
  }, [editingHeadline, reset]);

  const createMutation = useMutation({
    mutationFn: async (values: HeadlineFormValues) => {
      return api.headlines.post({
        profile_id: profile!.id,
        label: values.label,
        summary_text: values.summaryText,
        role_tag_ids: selectedTags.map(t => t.id)
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
      return api.headlines({ id }).put({
        label: values.label,
        summary_text: values.summaryText,
        role_tag_ids: selectedTags.map(t => t.id)
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
      return api.headlines({ id }).delete();
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

  function removeTag(tagId: string) {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  }

  function addTag(tag: RoleTag) {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagPopoverOpen(false);
  }

  const unselectedTags = availableTags.filter(t => !selectedTags.some(s => s.id === t.id));

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
                <TableHead>Role Tags</TableHead>
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
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : headlines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No headlines yet. Add your first headline.
                  </TableCell>
                </TableRow>
              ) : (
                headlines.map((headline: Headline) => (
                  <TableRow key={headline.id}>
                    <TableCell className="font-medium">{headline.label}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{headline.summaryText}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {headline.roleTags?.map(tag => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
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
                ? 'Update the headline label, summary text, and role tags.'
                : 'Create a new headline for your resume.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder='e.g. "Full-Stack Engineer"' {...register('label')} />
              {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
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
            <div className="space-y-2">
              <Label>Role Tags</Label>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
                    {tag.name}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                      onClick={() => removeTag(tag.id)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag.name}</span>
                    </button>
                  </Badge>
                ))}
                <Popover open={tagPopoverOpen} onOpenChange={open => setTagPopoverOpen(open)}>
                  <PopoverTrigger
                    render={
                      <Button type="button" variant="outline" size="sm" className="h-5 gap-1 text-xs">
                        Add Tag
                        <ChevronsUpDown className="h-3 w-3 opacity-50" />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-48 p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList>
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {unselectedTags.map(tag => (
                            <CommandItem key={tag.id} value={tag.name} onSelect={() => addTag(tag)}>
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
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
              Are you sure you want to delete "{deleteTarget?.label}"? This action cannot be undone.
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
