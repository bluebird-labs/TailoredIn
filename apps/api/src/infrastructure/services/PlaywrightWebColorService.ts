import { injectable } from '@needle-di/core';
import { ColorUtil, EnumUtil } from '@tailoredin/shared';
import { Vibrant } from 'node-vibrant/node';
import * as NpmLog from 'npmlog';
import * as Playwright from 'playwright';
import type { WebColorService, ColorPaletteDto } from '@tailoredin/application-resume';

enum PaletteKey {
  VIBRANT = 'Vibrant',
  DARK_VIBRANT = 'DarkVibrant',
  LIGHT_VIBRANT = 'LightVibrant',
  MUTED = 'Muted',
  DARK_MUTED = 'DarkMuted',
  LIGHT_MUTED = 'LightMuted'
}

@injectable()
export class PlaywrightWebColorService implements WebColorService {
  async findPalette(websiteUrl: string): Promise<ColorPaletteDto> {
    const browser = await Playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(websiteUrl);
    await page.waitForLoadState('domcontentloaded');
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    const palette = await Vibrant.from(screenshot).getPalette();

    return {
      vibrant: palette.Vibrant?.hex ?? null,
      darkVibrant: palette.DarkVibrant?.hex ?? null,
      lightVibrant: palette.LightVibrant?.hex ?? null,
      muted: palette.Muted?.hex ?? null,
      darkMuted: palette.DarkMuted?.hex ?? null,
      lightMuted: palette.LightMuted?.hex ?? null
    };
  }

  async findPrimaryColor(websiteUrl: string): Promise<string | null> {
    try {
      const browser = await Playwright.chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto(websiteUrl);
      await page.waitForLoadState('domcontentloaded');
      const screenshot = await page.screenshot({ fullPage: true });
      await browser.close();

      const palette = await Vibrant.from(screenshot).getPalette();
      const rgbByKey = new Map<PaletteKey, [number, number, number]>();

      for (const [name, swatch] of Object.entries(palette)) {
        if (swatch !== null && EnumUtil.is(name, PaletteKey)) {
          const rgb = swatch.rgb as [number, number, number];
          const isTitle = ColorUtil.meetsWCAGLargeTextContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb);
          const isGray = ColorUtil.isRgbGrayish(rgb);
          if (!isGray && isTitle) {
            rgbByKey.set(name as PaletteKey, rgb);
          }
        }
      }

      for (const key of [PaletteKey.VIBRANT, PaletteKey.DARK_VIBRANT, PaletteKey.LIGHT_VIBRANT]) {
        if (rgbByKey.has(key)) {
          return ColorUtil.rgbTripleToHex(rgbByKey.get(key)!);
        }
      }
    } catch (err) {
      NpmLog.warn(PlaywrightWebColorService.name, `Error extracting colors from ${websiteUrl}`, err);
    }

    return null;
  }
}
