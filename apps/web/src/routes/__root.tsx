import { createRootRoute, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AppSidebar } from '@/components/layout/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { isAuthenticated } from '@/lib/auth.js';
import { applyTheme, getEffectiveTheme } from '@/lib/theme.js';

export const Route = createRootRoute({
  component: RootLayout
});

function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    applyTheme(getEffectiveTheme());
  }, []);

  useEffect(() => {
    if (!isLoginPage && !isAuthenticated()) {
      navigate({ to: '/login' });
    }
  }, [isLoginPage, navigate]);

  if (isLoginPage) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 px-9 py-8">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
