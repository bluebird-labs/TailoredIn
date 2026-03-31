const THEME_KEY = 'tailoredin-theme';
const PALETTE_KEY = 'tailoredin-palette';

export type Theme = 'light' | 'dark';
export type Palette = 'orange' | 'teal' | 'indigo' | 'violet';

export const PALETTES: readonly Palette[] = ['orange', 'teal', 'indigo', 'violet'] as const;

const PALETTE_CLASSES: Record<Palette, string | null> = {
  orange: null,
  teal: 'palette-teal',
  indigo: 'palette-indigo',
  violet: 'palette-violet'
};

/** Representative primary color for each palette (used by the swatch picker). */
export const PALETTE_COLORS: Record<Palette, string> = {
  orange: 'oklch(0.6 0.16 45)',
  teal: 'oklch(0.55 0.14 170)',
  indigo: 'oklch(0.55 0.18 265)',
  violet: 'oklch(0.55 0.18 300)'
};

// ── Theme (light / dark) ──

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

// ── Palette ──

export function getStoredPalette(): Palette {
  const stored = localStorage.getItem(PALETTE_KEY);
  if (stored && stored in PALETTE_CLASSES) return stored as Palette;
  return 'orange';
}

export function applyPalette(palette: Palette): void {
  const el = document.documentElement;
  for (const cls of Object.values(PALETTE_CLASSES)) {
    if (cls) el.classList.remove(cls);
  }
  const cls = PALETTE_CLASSES[palette];
  if (cls) el.classList.add(cls);
  localStorage.setItem(PALETTE_KEY, palette);
}
