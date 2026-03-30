import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-user';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export const Route = createFileRoute('/resume/profile')({
  component: ProfilePage
});

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional().default(''),
  githubHandle: z.string().optional().default(''),
  linkedinHandle: z.string().optional().default(''),
  locationLabel: z.string().optional().default('')
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function toFormValues(user: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  githubHandle: string | null;
  linkedinHandle: string | null;
  locationLabel: string | null;
}): ProfileFormValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber ?? '',
    githubHandle: user.githubHandle ?? '',
    linkedinHandle: user.linkedinHandle ?? '',
    locationLabel: user.locationLabel ?? ''
  };
}

function ProfilePage() {
  const { data: userResponse, isLoading } = useCurrentUser();
  const user = userResponse?.data;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: user ? toFormValues(user) : undefined
  });

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) return;
      return api.users({ userId: user.id }).put({
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        phone_number: values.phoneNumber || null,
        github_handle: values.githubHandle || null,
        linkedin_handle: values.linkedinHandle || null,
        location_label: values.locationLabel || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">Your personal information for resume generation.</p>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-muted-foreground mt-2">Your personal information for resume generation.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(values => updateMutation.mutate(values))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input id="phoneNumber" {...register('phoneNumber')} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="githubHandle">GitHub handle</Label>
                <Input id="githubHandle" {...register('githubHandle')} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinHandle">LinkedIn handle</Label>
                <Input id="linkedinHandle" {...register('linkedinHandle')} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationLabel">Location</Label>
              <Input id="locationLabel" {...register('locationLabel')} placeholder="Optional" />
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={!isDirty} onClick={() => reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
