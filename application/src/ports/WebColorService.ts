export type ColorPaletteDto = {
  vibrant: string | null;
  darkVibrant: string | null;
  lightVibrant: string | null;
  muted: string | null;
  darkMuted: string | null;
  lightMuted: string | null;
};

export interface WebColorService {
  findPalette(websiteUrl: string): Promise<ColorPaletteDto>;
  findPrimaryColor(websiteUrl: string): Promise<string | null>;
}
