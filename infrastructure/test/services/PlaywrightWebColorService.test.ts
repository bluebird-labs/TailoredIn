import { describe, expect, it } from 'bun:test';
import { ColorUtil } from '@tailoredin/core';

describe('PlaywrightWebColorService color filtering', () => {
  it('rejects colors passing 3.5:1 but failing 4.5:1 against white', () => {
    // #8B8000 (dark yellow) passes 3.5:1 but fails 4.5:1
    const rgb: ColorUtil.RGBTriple = [139, 128, 0];
    expect(ColorUtil.meetsWCAGLargeTextContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb)).toBe(true);
    expect(ColorUtil.meetsWCAGNormalTextContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb)).toBe(false);
  });

  it('default fallback #0395DE contrast ratio against white', () => {
    // #0395DE (brilliant-cv skyblue) has a contrast ratio of ~3.3:1 against white.
    // NOTE: this does not meet WCAG AA normal text (4.5:1) or large text (3.5:1).
    // The color is used as a decorative accent, not as body text on a white background.
    const rgb = ColorUtil.hexToRgb('#0395DE');
    const ratio = ColorUtil.getRgbContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb);
    expect(ratio).toBeGreaterThan(3.0);
    expect(ratio).toBeLessThan(4.5);
  });
});
