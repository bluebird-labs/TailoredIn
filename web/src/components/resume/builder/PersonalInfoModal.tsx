import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

type Profile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl?: string | null;
};

type PersonalInfoModalProps = {
  open: boolean;
  onClose: () => void;
  profile: Profile;
};

export function PersonalInfoModal({ open, onClose, profile }: PersonalInfoModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    website_url: ''
  });

  useEffect(() => {
    if (open) {
      setForm({
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone ?? '',
        location: profile.location ?? '',
        linkedin_url: profile.linkedinUrl ?? '',
        github_url: profile.githubUrl ?? '',
        website_url: profile.websiteUrl ?? ''
      });
    }
  }, [open, profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await api.profile.put({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        location: form.location || null,
        linkedin_url: form.linkedin_url || null,
        github_url: form.github_url || null,
        website_url: form.website_url || null
      });
      if (error) throw new Error('Failed to update profile');
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
      toast.success('Profile updated');
      onClose();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Personal Info</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pi-first">First Name</Label>
              <Input id="pi-first" value={form.first_name} onChange={update('first_name')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pi-last">Last Name</Label>
              <Input id="pi-last" value={form.last_name} onChange={update('last_name')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pi-email">Email</Label>
            <Input id="pi-email" type="email" value={form.email} onChange={update('email')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pi-phone">Phone</Label>
              <Input id="pi-phone" value={form.phone} onChange={update('phone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pi-location">Location</Label>
              <Input id="pi-location" value={form.location} onChange={update('location')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pi-linkedin">LinkedIn URL</Label>
            <Input id="pi-linkedin" value={form.linkedin_url} onChange={update('linkedin_url')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pi-github">GitHub URL</Label>
            <Input id="pi-github" value={form.github_url} onChange={update('github_url')} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
