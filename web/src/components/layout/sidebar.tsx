import { Link, useMatchRoute } from '@tanstack/react-router';
import { BookOpen, GraduationCap, type LucideIcon, Sparkles, User } from 'lucide-react';
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
  { label: 'Profile', to: '/resume', icon: User },
  { label: 'Experience', to: '/resume', icon: BookOpen },
  { label: 'Headlines', to: '/resume', icon: BookOpen },
  { label: 'Education', to: '/resume', icon: GraduationCap }
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
