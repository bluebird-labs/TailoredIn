import { Link, useMatchRoute } from '@tanstack/react-router';
import { Briefcase, GraduationCap, Heading, type LucideIcon, Sparkles, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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

const appNav: NavItem[] = [
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Experiences', to: '/experiences', icon: Briefcase },
  { label: 'Headlines', to: '/headlines', icon: Heading },
  { label: 'Education', to: '/education', icon: GraduationCap }
];

export function AppSidebar() {
  const matchRoute = useMatchRoute();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold">TailoredIn</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {appNav.map(item => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    render={<Link to={item.to} />}
                    isActive={!!matchRoute({ to: item.to, fuzzy: true })}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
