import { describe, expect, it } from 'bun:test';
import { ColorUtil } from '@tailoredin/core';

describe('PlaywrightWebColorService color filtering', () => {
  it('rejects colors passing 3.5:1 but failing 4.5:1 against white', () => {
    // #8B8000 (dark yellow) passes 3.5:1 but fails 4.5:1
    const rgb: ColorUtil.RGBTriple = [139, 128, 0];
    expect(ColorUtil.meetsWCAGLargeTextContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb)).toBe(true);
    expect(ColorUtil.meetsWCAGNormalTextContrastRatio(ColorUtil.PURE_WHITE_RGB, rgb)).toBe(false);
  });
});
