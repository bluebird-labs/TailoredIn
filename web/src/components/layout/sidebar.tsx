import { Link, useMatchRoute } from '@tanstack/react-router';
import { BookOpen, type LucideIcon, Sparkles, Wand2, Wrench } from 'lucide-react';
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

const resumeNav: NavItem[] = [
  { label: 'Wardrobe', to: '/resume', search: { tab: 'wardrobe' }, icon: BookOpen },
  { label: 'Factory', to: '/resume', search: { tab: 'factory' }, icon: Wand2 },
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
      </SidebarContent>
    </Sidebar>
  );
}
