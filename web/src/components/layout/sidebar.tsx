import { Link, useMatchRoute } from '@tanstack/react-router';
import {
  Building2,
  FileText,
  KanbanSquare,
  type LucideIcon,
  Moon,
  Palette,
  Settings,
  Sparkles,
  Sun,
  User
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { applyTheme, getEffectiveTheme } from '@/lib/theme.js';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const workroomNav: NavItem[] = [
  { label: 'Profile', to: '/profile', icon: User },
  { label: 'Atelier', to: '/atelier', icon: Palette },
  { label: 'Settings', to: '/settings', icon: Settings }
];

const pipelineNav: NavItem[] = [
  { label: 'Rack', to: '/rack', icon: KanbanSquare },
  { label: 'Jobs', to: '/jobs', icon: FileText },
  { label: 'Companies', to: '/companies', icon: Building2 }
];

const adminNav: NavItem[] = [{ label: 'Skills', to: '/skills', icon: Sparkles }];

export function AppSidebar() {
  const matchRoute = useMatchRoute();
  const [theme, setTheme] = useState(getEffectiveTheme);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <svg viewBox="0 0 100 100" className="h-6 w-6 shrink-0" aria-hidden="true">
            <path
              d="M22,22 L50,50 L22,78"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.45"
            />
            <path
              d="M36,26 L58,50 L36,74"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d="M50,30 L66,50 L50,70"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="1"
            />
            <circle cx="76" cy="50" r="4" fill="currentColor" />
          </svg>
          <span className="text-sidebar-primary text-lg font-medium">TailoredIn</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Workroom</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workroomNav.map(item => (
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pipelineNav.map(item => (
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest">Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map(item => (
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
      <SidebarFooter>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
