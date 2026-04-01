import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Check, ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { useExperiences } from '@/hooks/use-experiences';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/resume/experience')({
  component: ExperiencePage
});

// ── Types ──────────────────────────────────────────────────────────────────

type BulletVariant = {
  id: string;
  text: string;
  angle: string;
  source: string;
  approvalStatus: string;
  roleTags: { id: string; name: string; dimension: string }[];
  skillTags: { id: string; name: string; dimension: string }[];
};

type Bullet = {
  id: string;
  content: string;
  ordinal: number;
  roleTags: { id: string; name: string; dimension: string }[];
  skillTags: { id: string; name: string; dimension: string }[];
  variants: BulletVariant[];
};

type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bullets: Bullet[];
};

// ── Schemas ────────────────────────────────────────────────────────────────

const experienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  companyWebsite: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  summary: z.string().optional(),
  ordinal: z.coerce.number().int().min(0)
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────

const APPROVAL_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

function invalidateExperiences(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
}

// ── Main Page ──────────────────────────────────────────────────────────────

function ExperiencePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useExperiences();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);

  const experiences = (data ?? []) as Experience[];

  // ── Experience CRUD mutations ──

  const createMutation = useMutation({
    mutationFn: async (values: ExperienceFormValues) => {
      return api.experiences.post({
        title: values.title,
        company_name: values.companyName,
        company_website: values.companyWebsite || undefined,
        location: values.location,
        start_date: values.startDate,
        end_date: values.endDate,
        summary: values.summary || undefined,
        ordinal: values.ordinal
      });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setDialogOpen(false);
      toast.success('Experience created');
    },
    onError: () => toast.error('Failed to create experience')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ExperienceFormValues }) => {
      return api.experiences({ id }).put({
        title: values.title,
        company_name: values.companyName,
        company_website: values.companyWebsite || undefined,
        location: values.location,
        start_date: values.startDate,
        end_date: values.endDate,
        summary: values.summary || undefined,
        ordinal: values.ordinal
      });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setDialogOpen(false);
      setEditingExperience(null);
      toast.success('Experience updated');
    },
    onError: () => toast.error('Failed to update experience')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.experiences({ id }).delete(),
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setDeleteTarget(null);
      toast.success('Experience deleted');
    },
    onError: () => toast.error('Failed to delete experience')
  });

  // ── Form ──

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: { title: '', companyName: '', companyWebsite: '', location: '', startDate: '', endDate: '', summary: '', ordinal: 0 }
  });

  useEffect(() => {
    if (editingExperience) {
      reset({
        title: editingExperience.title,
        companyName: editingExperience.companyName,
        companyWebsite: editingExperience.companyWebsite ?? '',
        location: editingExperience.location,
        startDate: editingExperience.startDate,
        endDate: editingExperience.endDate,
        summary: editingExperience.summary ?? '',
        ordinal: editingExperience.ordinal
      });
    } else {
      reset({ title: '', companyName: '', companyWebsite: '', location: '', startDate: '', endDate: '', summary: '', ordinal: 0 });
    }
  }, [editingExperience, reset]);

  function openAdd() {
    setEditingExperience(null);
    setDialogOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditingExperience(exp);
    setDialogOpen(true);
  }

  function onSubmit(values: ExperienceFormValues) {
    if (editingExperience) {
      updateMutation.mutate({ id: editingExperience.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Experience</h1>
          <p className="text-muted-foreground mt-1">Experiences, bullet points, and tailored variants.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && experiences.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No experiences yet.</p>
          <p className="text-sm text-muted-foreground">Add your first experience to get started.</p>
        </div>
      )}

      {!isLoading &&
        experiences.map(exp => (
          <ExperienceCard key={exp.id} experience={exp} onEdit={() => openEdit(exp)} onDelete={() => setDeleteTarget(exp)} />
        ))}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setEditingExperience(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
            <DialogDescription>
              {editingExperience ? 'Update this work experience entry.' : 'Add a new work experience entry.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Senior Engineer" {...register('title')} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input id="companyName" placeholder="Acme Corp" {...register('companyName')} />
                {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website (optional)</Label>
                <Input id="companyWebsite" placeholder="https://acme.com" {...register('companyWebsite')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="San Francisco, CA" {...register('location')} />
                {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" placeholder="Jan 2022" {...register('startDate')} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" placeholder="Present" {...register('endDate')} />
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary (optional)</Label>
              <textarea
                id="summary"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Brief description of the role..."
                {...register('summary')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordinal">Order</Label>
              <Input id="ordinal" type="number" min={0} {...register('ordinal')} />
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experience</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}" at {deleteTarget?.companyName}? This will also
              delete all bullets and variants.
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

// ── Experience Card ────────────────────────────────────────────────────────

function ExperienceCard({
  experience,
  onEdit,
  onDelete
}: {
  experience: Experience;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [addingBullet, setAddingBullet] = useState(false);
  const [newBulletContent, setNewBulletContent] = useState('');

  const addBulletMutation = useMutation({
    mutationFn: async () => {
      return api.experiences({ id: experience.id }).bullets.post({
        content: newBulletContent,
        ordinal: experience.bullets.length
      });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setAddingBullet(false);
      setNewBulletContent('');
      toast.success('Bullet added');
    },
    onError: () => toast.error('Failed to add bullet')
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-lg">{experience.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {experience.companyName} &middot; {experience.location}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {experience.startDate} &ndash; {experience.endDate}
          </p>
          {experience.summary && <p className="text-sm text-muted-foreground mt-2">{experience.summary}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {experience.bullets.map(bullet => (
          <BulletRow key={bullet.id} bullet={bullet} experienceId={experience.id} />
        ))}

        {addingBullet ? (
          <div className="flex items-center gap-2">
            <Input
              value={newBulletContent}
              onChange={e => setNewBulletContent(e.target.value)}
              placeholder="Bullet point content..."
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && newBulletContent.trim()) addBulletMutation.mutate();
                if (e.key === 'Escape') setAddingBullet(false);
              }}
            />
            <Button
              size="sm"
              onClick={() => addBulletMutation.mutate()}
              disabled={!newBulletContent.trim() || addBulletMutation.isPending}
            >
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAddingBullet(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAddingBullet(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Bullet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Bullet Row ─────────────────────────────────────────────────────────────

function BulletRow({ bullet, experienceId }: { bullet: Bullet; experienceId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(bullet.content);
  const [showVariants, setShowVariants] = useState(false);
  const [addingVariant, setAddingVariant] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return api.bullets({ id: bullet.id }).put({
        experience_id: experienceId,
        content: editContent,
        ordinal: bullet.ordinal
      });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      setEditing(false);
      toast.success('Bullet updated');
    },
    onError: () => toast.error('Failed to update bullet')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.bullets({ id: bullet.id }).delete({ experience_id: experienceId });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Bullet deleted');
    },
    onError: () => toast.error('Failed to delete bullet')
  });

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground mt-0.5 select-none">&bull;</span>
        {editing ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && editContent.trim()) updateMutation.mutate();
                if (e.key === 'Escape') {
                  setEditing(false);
                  setEditContent(bullet.content);
                }
              }}
            />
            <Button size="sm" onClick={() => updateMutation.mutate()} disabled={!editContent.trim()}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setEditContent(bullet.content);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="flex-1 text-sm">{bullet.content}</p>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {bullet.variants.length > 0 && (
            <Button variant="ghost" size="icon-sm" onClick={() => setShowVariants(!showVariants)}>
              {showVariants ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tags */}
      {(bullet.roleTags.length > 0 || bullet.skillTags.length > 0) && (
        <div className="flex flex-wrap gap-1 ml-4">
          {bullet.roleTags.map(t => (
            <Badge key={t.name} variant="secondary" className="text-xs">
              {t.name}
            </Badge>
          ))}
          {bullet.skillTags.map(t => (
            <Badge key={t.name} variant="outline" className="text-xs">
              {t.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Variant toggle + list */}
      {showVariants && (
        <div className="ml-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Variants ({bullet.variants.length})
          </p>
          {bullet.variants.map(variant => (
            <VariantRow key={variant.id} variant={variant} bulletId={bullet.id} experienceId={experienceId} />
          ))}
        </div>
      )}

      {/* Add variant button / inline form */}
      <div className="ml-4">
        {addingVariant ? (
          <AddVariantForm
            experienceId={experienceId}
            bulletId={bullet.id}
            onClose={() => setAddingVariant(false)}
          />
        ) : (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setAddingVariant(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Add Variant
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bullet</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bullet and all its variants?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
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

// ── Variant Row ────────────────────────────────────────────────────────────

function VariantRow({
  variant,
  bulletId,
  experienceId
}: {
  variant: BulletVariant;
  bulletId: string;
  experienceId: string;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return api.variants({ id: variant.id }).delete({ experience_id: experienceId, bullet_id: bulletId });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant deleted');
    },
    onError: () => toast.error('Failed to delete variant')
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      return api.variants({ id: variant.id }).approve.put({ experience_id: experienceId, bullet_id: bulletId });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant approved');
    },
    onError: () => toast.error('Failed to approve variant')
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return api.variants({ id: variant.id }).reject.put({ experience_id: experienceId, bullet_id: bulletId });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      toast.success('Variant rejected');
    },
    onError: () => toast.error('Failed to reject variant')
  });

  return (
    <div className="flex items-start gap-2 rounded border bg-muted/30 p-2 text-sm">
      <div className="flex-1 space-y-1">
        <p>{variant.text}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {variant.angle}
          </Badge>
          <Badge className={`text-xs ${APPROVAL_BADGE[variant.approvalStatus] ?? ''}`}>
            {variant.approvalStatus}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {variant.source}
          </Badge>
          {variant.roleTags.map(t => (
            <Badge key={t.name} variant="secondary" className="text-xs">
              {t.name}
            </Badge>
          ))}
          {variant.skillTags.map(t => (
            <Badge key={t.name} variant="outline" className="text-xs">
              {t.name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {variant.approvalStatus === 'PENDING' && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              title="Approve"
            >
              <Check className="h-3.5 w-3.5 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending}
              title="Reject"
            >
              <X className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          title="Delete variant"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Add Variant Form ───────────────────────────────────────────────────────

function AddVariantForm({
  experienceId,
  bulletId,
  onClose
}: {
  experienceId: string;
  bulletId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [angle, setAngle] = useState('');

  const addMutation = useMutation({
    mutationFn: async () => {
      return api.bullets({ id: bulletId }).variants.post({
        experience_id: experienceId,
        text,
        angle,
        source: 'manual',
        role_tags: [],
        skill_tags: []
      });
    },
    onSuccess: () => {
      invalidateExperiences(queryClient);
      onClose();
      toast.success('Variant added');
    },
    onError: () => toast.error('Failed to add variant')
  });

  return (
    <div className="flex flex-col gap-2 rounded border p-2 bg-muted/20">
      <Input value={text} onChange={e => setText(e.target.value)} placeholder="Variant text..." />
      <div className="flex gap-2">
        <Input value={angle} onChange={e => setAngle(e.target.value)} placeholder="Angle (e.g. leadership)" className="flex-1" />
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!text.trim() || !angle.trim() || addMutation.isPending}
        >
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
