import { Link, useMatchRoute } from '@tanstack/react-router';
import { Archive, Briefcase, FileText, GitBranch, Inbox, type LucideIcon, Sparkles, Wrench } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface NavItem {
  label: string;
  to: string;
  search?: Record<string, unknown>;
  icon: LucideIcon;
}

const jobsNav: NavItem[] = [
  { label: 'Triage', to: '/jobs', search: { view: 'triage' }, icon: Inbox },
  { label: 'Pipeline', to: '/jobs', search: { view: 'pipeline' }, icon: GitBranch },
  { label: 'Archive', to: '/jobs', search: { view: 'archive' }, icon: Archive },
  { label: 'All Jobs', to: '/jobs', search: { view: 'all' }, icon: Briefcase }
];

const resumeNav: NavItem[] = [
  { label: 'Builder', to: '/resume/builder', icon: FileText },
  { label: 'Skills', to: '/resume/skills', icon: Wrench }
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const matchRoute = useMatchRoute();

  function isActive(item: NavItem) {
    if (!item.search) return !!matchRoute({ to: item.to, fuzzy: true });
    return !!matchRoute({ to: item.to, fuzzy: true, search: item.search });
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={`${item.to}-${item.label}`}>
              <SidebarMenuButton render={<Link to={item.to} search={item.search ?? {}} />} isActive={isActive(item)}>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold">TailoredIn</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Resume" items={resumeNav} />
        <NavGroup label="Discovery" items={jobsNav} />
      </SidebarContent>
    </Sidebar>
  );
}
