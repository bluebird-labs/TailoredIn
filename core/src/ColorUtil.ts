export namespace ColorUtil {
  export type RGBTriple = [number, number, number];

  export const PURE_WHITE_RGB: RGBTriple = [255, 255, 255];
  export const WCAG_NORMAL_TEXT_RATIO = 4.5;
  export const WCAG_LARGE_TEXT_RATIO = 3.5;

  export const hexToRgb = (hex: string): RGBTriple => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);

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
      const sRgb = value / 255;
      return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
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
    `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;

  const rgbToHsl = ([rRaw, gRaw, bRaw]: RGBTriple): [number, number, number] => {
    const r = rRaw / 255;
    const g = gRaw / 255;
    const b = bRaw / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    if (max === min) return [0, 0, l];

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;

    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;

    return [h, s, l];
  };

  const hslToRgb = ([h, s, l]: [number, number, number]): RGBTriple => {
    if (s === 0) {
      const v = Math.round(l * 255);
      return [v, v, v];
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    ];
  };

  export const darkenForContrast = (
    rgb: RGBTriple,
    backgroundRgb: RGBTriple,
    targetRatio: number
  ): RGBTriple | null => {
    if (getRgbContrastRatio(backgroundRgb, rgb) >= targetRatio) {
      return rgb;
    }

    const [h, s, l] = rgbToHsl(rgb);

    for (let newL = l; newL >= 0; newL -= 0.01) {
      const candidate = hslToRgb([h, s, newL]);
      if (getRgbContrastRatio(backgroundRgb, candidate) >= targetRatio) {
        return candidate;
      }
    }

    return null;
  };
}
