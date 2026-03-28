import { injectable } from '@needle-di/core';
import { Vibrant } from 'node-vibrant/node';
import * as PlayRight from 'playwright';

export type FindWebsitePaletteInput = {
  website: string;
};

export type VibrantSwatch = {
  rgb: [number, number, number];
  hex: string;
  population: number;
};

export type VibrantPalette = Record<string, VibrantSwatch | null>;

export enum PaletteKey {
  VIBRANT = 'Vibrant',
  DARK_VIBRANT = 'DarkVibrant',
  LIGHT_VIBRANT = 'LightVibrant',
  MUTED = 'Muted',
  DARK_MUTED = 'DarkMuted',
  LIGHT_MUTED = 'LightMuted'
}

@injectable()
export class WebsiteColorsFinder {
  public async findWebsitePalette(input: FindWebsitePaletteInput): Promise<VibrantPalette> {
    const browser = await PlayRight.chromium.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(input.website);
    await page.waitForLoadState('domcontentloaded');

    const imageBuffer = await page.screenshot({
      fullPage: true
    });

    return Vibrant.from(imageBuffer).getPalette() as unknown as VibrantPalette;
  }
}
