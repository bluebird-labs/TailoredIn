import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { toggleTheme, type Theme } from '@/lib/theme.js';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  function handleToggle() {
    const next = toggleTheme();
    setTheme(next);
  }

  return (
    <SidebarMenuButton onClick={handleToggle}>
      {theme === 'dark' ? <Moon /> : <Sun />}
      <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </SidebarMenuButton>
  );
}
