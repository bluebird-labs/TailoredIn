import { Link, useMatchRoute } from '@tanstack/react-router';
import { Briefcase, GraduationCap, Layers, type LucideIcon, ScrollText, Sparkles, User, Wrench } from 'lucide-react';
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
  icon: LucideIcon;
}

const jobsNav: NavItem[] = [{ label: 'Jobs', to: '/jobs', icon: Briefcase }];

const resumeNav: NavItem[] = [
  { label: 'Profile', to: '/resume/profile', icon: User },
  { label: 'Experience', to: '/resume/experience', icon: ScrollText },
  { label: 'Skills', to: '/resume/skills', icon: Wrench },
  { label: 'Education', to: '/resume/education', icon: GraduationCap }
];

const archetypeNav: NavItem[] = [{ label: 'Archetypes', to: '/archetypes', icon: Layers }];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const matchRoute = useMatchRoute();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton asChild isActive={!!matchRoute({ to: item.to, fuzzy: true })}>
                <Link to={item.to}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
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
        <NavGroup label="Discovery" items={jobsNav} />
        <NavGroup label="Resume" items={resumeNav} />
        <NavGroup label="Templates" items={archetypeNav} />
      </SidebarContent>
    </Sidebar>
  );
}
