export namespace ColorUtil {
  export type RGBTriple = [number, number, number];

  export const hexToRgb = (hex: string): RGBTriple => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) {
      throw new Error(`Invalid hex color: ${hex}`);
    }

    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ];
  };

  export const hexToRgbString = (hex: string) => {
    return rgbTripleToString(hexToRgb(hex));
  };

  export const rgbTripleToString = ([red, green, blue]: RGBTriple): string => {
    return `rgb(${red}, ${green}, ${blue})`;
  };

  export const rgbTripleToHex = ([r, g, b]: RGBTriple): string =>
    '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
