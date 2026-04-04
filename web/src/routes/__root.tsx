import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { applyTheme, getEffectiveTheme } from '@/lib/theme.js';

export const Route = createRootRoute({
  component: RootLayout
});

function RootLayout() {
  useEffect(() => {
    applyTheme(getEffectiveTheme());
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
