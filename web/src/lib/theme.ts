const THEME_KEY = 'tailoredin-theme';
const PALETTE_KEY = 'tailoredin-palette';

type Theme = 'light' | 'dark';
type Palette = 'orange' | 'teal' | 'indigo' | 'violet';

const PALETTE_CLASSES: Record<Palette, string | null> = {
  orange: null,
  teal: 'palette-teal',
  indigo: 'palette-indigo',
  violet: 'palette-violet'
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
