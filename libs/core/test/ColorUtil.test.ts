import { ColorUtil } from '../src/ColorUtil.js';

describe('ColorUtil.darkenForContrast', () => {
  it('returns original color if it already meets the ratio', () => {
    const darkBlue: ColorUtil.RGBTriple = [0, 0, 139]; // #00008B — very high contrast vs white
    const result = ColorUtil.darkenForContrast(darkBlue, ColorUtil.PURE_WHITE_RGB, 4.5);
    expect(result).toEqual(darkBlue);
  });

  it('darkens a light color until it meets the target ratio', () => {
    const lightOrange: ColorUtil.RGBTriple = [255, 165, 0]; // #FFA500 — fails 4.5:1 vs white
    expect(ColorUtil.meetsWCAGNormalTextContrastRatio(ColorUtil.PURE_WHITE_RGB, lightOrange)).toBe(false);

    const result = ColorUtil.darkenForContrast(lightOrange, ColorUtil.PURE_WHITE_RGB, 4.5);
    expect(result).not.toBeNull();
    expect(ColorUtil.getRgbContrastRatio(ColorUtil.PURE_WHITE_RGB, result!)).toBeGreaterThanOrEqual(4.5);
  });

  it('preserves hue when darkening', () => {
    const red: ColorUtil.RGBTriple = [255, 100, 100]; // light red, fails 4.5:1
    const result = ColorUtil.darkenForContrast(red, ColorUtil.PURE_WHITE_RGB, 4.5);
    expect(result).not.toBeNull();
    // Red channel should still be dominant
    expect(result![0]).toBeGreaterThan(result![1]);
    expect(result![0]).toBeGreaterThan(result![2]);
  });

  it('returns null when target ratio is impossible', () => {
    const white: ColorUtil.RGBTriple = [255, 255, 255];
    const result = ColorUtil.darkenForContrast(white, white, 22); // ratio > 21 is impossible
    expect(result).toBeNull();
  });
});
