import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { TagInput } from '@/components/shared/tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateArchetype } from '@/hooks/use-archetypes';

type Headline = {
  id: string;
  headlineLabel: string;
};

type MetadataSectionProps = {
  archetypeId: string;
  archetypeLabel: string;
  archetypeDescription: string | null;
  headlineId: string;
  socialNetworks: string[];
  headlines: Headline[];
};

const metadataSchema = z.object({
  archetypeLabel: z.string().min(1, 'Label is required'),
  archetypeDescription: z.string().nullable().default(null),
  headlineId: z.string().min(1, 'Headline is required'),
  socialNetworks: z.array(z.string()).default([])
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

export function MetadataSection({
  archetypeId,
  archetypeLabel,
  archetypeDescription,
  headlineId,
  socialNetworks,
  headlines
}: MetadataSectionProps) {
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdateArchetype();

  const headlineName = headlines.find(h => h.id === headlineId)?.headlineLabel ?? '—';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    values: {
      archetypeLabel,
      archetypeDescription,
      headlineId,
      socialNetworks
    }
  });

  function onCancel() {
    reset();
    setEditing(false);
  }

  function onSubmit(values: MetadataFormValues) {
    updateMutation.mutate(
      {
        id: archetypeId,
        archetype_label: values.archetypeLabel,
        archetype_description: values.archetypeDescription,
        headline_id: values.headlineId,
        social_networks: values.socialNetworks
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Metadata updated');
        },
        onError: () => toast.error('Failed to update metadata')
      }
    );
  }

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Metadata</CardTitle>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Label</span>
            <p>{archetypeLabel}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Description</span>
            <p>{archetypeDescription ?? '—'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Headline</span>
            <p>{headlineName}</p>
          </div>
          {socialNetworks.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Social Networks</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {socialNetworks.map(sn => (
                  <Badge key={sn} variant="secondary">
                    {sn}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="md-label">Label</Label>
            <Input id="md-label" {...register('archetypeLabel')} />
            {errors.archetypeLabel && <p className="text-sm text-destructive">{errors.archetypeLabel.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="md-desc">Description</Label>
            <textarea
              id="md-desc"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                        {h.headlineLabel}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
