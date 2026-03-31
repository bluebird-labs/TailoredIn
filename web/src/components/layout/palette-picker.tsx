import { useState } from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { applyPalette, getStoredPalette, PALETTE_COLORS, PALETTES, type Palette } from '@/lib/theme.js';

const LABELS: Record<Palette, string> = {
  orange: 'Orange',
  teal: 'Teal',
  indigo: 'Indigo',
  violet: 'Violet'
};

export function PalettePicker() {
  const [current, setCurrent] = useState<Palette>(getStoredPalette);

  function handleSelect(palette: Palette) {
    applyPalette(palette);
    setCurrent(palette);
  }

  return (
    <SidebarMenuButton className="flex items-center gap-2" onClick={() => handleSelect(nextPalette(current))}>
      <div className="flex gap-1">
        {PALETTES.map(p => (
          <span
            key={p}
            className="inline-block h-3 w-3 rounded-full ring-1 ring-sidebar-border"
            style={{
              backgroundColor: PALETTE_COLORS[p],
              outline: p === current ? '2px solid var(--sidebar-primary)' : 'none',
              outlineOffset: '1px'
            }}
          />
        ))}
      </div>
      <span>{LABELS[current]}</span>
    </SidebarMenuButton>
  );
}

function nextPalette(current: Palette): Palette {
  const idx = PALETTES.indexOf(current);
  return PALETTES[(idx + 1) % PALETTES.length];
}
