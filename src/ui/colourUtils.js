/**
 *
 * @flow
 */

class colourUtils {
  static overlayToColourChannel(c1, c2, a1) {
    return c2 + (c1 - c2) * a1;
  }

  static rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  static hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : null;
  }

  static calculateHexOverlay(
    hex1: string,
    hex2: string,
    alpha1: number,
  ): string {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);
    const r3 = this.overlayToColourChannel(rgb1.r, rgb2.r, alpha1);
    const g3 = this.overlayToColourChannel(rgb1.g, rgb2.g, alpha1);
    const b3 = this.overlayToColourChannel(rgb1.b, rgb2.b, alpha1);
    return this.rgbToHex(r3, g3, b3);
  }

  static calculateRGBOverlay(
    rgb1: string,
    rgb2: string,
    alpah1: number,
  ): string {
    const match1 = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.exec(rgb1);
    const match2 = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/.exec(rgb2);
    const r3 = this.overlayToColourChannel(match1[1], match2[1], alpah1);
    const g3 = this.overlayToColourChannel(match1[2], match2[2], alpah1);
    const b3 = this.overlayToColourChannel(match1[3], match2[3], alpah1);
    return this.rgbToHex(r3, g3, b3);
  }
}

export default colourUtils;
