import * as PlayRight from 'playwright';
import { Vibrant } from 'node-vibrant/node';
import { injectable } from 'inversify';

export type FindWebsitePaletteInput = {
  website: string;
};

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
  public async findWebsitePalette(input: FindWebsitePaletteInput) {
    const browser = await PlayRight.chromium.launch({
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(input.website);
    await page.waitForLoadState('domcontentloaded');

    const imageBuffer = await page.screenshot({
      fullPage: true
    });

    return Vibrant.from(imageBuffer).getPalette();
  }
}
