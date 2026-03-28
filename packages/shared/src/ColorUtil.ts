export namespace ColorUtil {
  export type RGBTriple = [number, number, number];

  export const PURE_WHITE_RGB: RGBTriple = [255, 255, 255];
  export const WCAG_NORMAL_TEXT_RATIO = 4.5;
  export const WCAG_LARGE_TEXT_RATIO = 3.5;

  export const hexToRgb = (hex: string): RGBTriple => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  };

  export const hexToRgbString = (hex: string) => {
    return rgbTripleToString(hexToRgb(hex));
  };

  export const rgbTripleToString = ([red, green, blue]: RGBTriple): string => {
    return `rgb(${red}, ${green}, ${blue})`;
  };

  export const getRgbLuminance = ([r, g, b]: RGBTriple): number => {
    const toLinear = (value: number) => {
      const sRGB = value / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  export const getRgbContrastRatio = (a: RGBTriple, b: RGBTriple): number => {
    const aLuminance = getRgbLuminance(a);
    const bLuminance = getRgbLuminance(b);
    const lighter = Math.max(aLuminance, bLuminance);
    const darker = Math.min(aLuminance, bLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  };

  export const meetsContrastRatio = (aRgb: RGBTriple, bRgb: RGBTriple, contrastRatio: number): boolean => {
    return getRgbContrastRatio(aRgb, bRgb) >= contrastRatio;
  };

  export const meetsWCAGNormalTextContrastRatio = (bgRgb: RGBTriple, textRgb: RGBTriple): boolean => {
    return meetsContrastRatio(bgRgb, textRgb, WCAG_NORMAL_TEXT_RATIO);
  };

  export const meetsWCAGLargeTextContrastRatio = (bgRgb: RGBTriple, textRgb: RGBTriple): boolean => {
    return meetsContrastRatio(bgRgb, textRgb, WCAG_LARGE_TEXT_RATIO);
  };

  export const isRgbGrayish = ([r, g, b]: RGBTriple, tolerance = 10): boolean => {
    return Math.abs(r - g) <= tolerance && Math.abs(g - b) <= tolerance && Math.abs(r - b) <= tolerance;
  };

  export const rgbTripleToHex = ([r, g, b]: RGBTriple): string =>
    '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
