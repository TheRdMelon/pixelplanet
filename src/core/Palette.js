/* @flow */

export type ColorIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31;
export type Color = string;

class Palette {
  length: number;
  rgb: Uint8Array;
  colors: Array<Color>;
  abgr: Uint32Array;
  fl: Array<number>;

  constructor(colors: Array) {
    this.length = colors.length;
    this.rgb = new Uint8Array(this.length * 3);
    this.colors = new Array(this.length);
    this.abgr = new Uint32Array(this.length);
    this.fl = new Array(this.length);

    let cnt = 0;
    for (let index = 0; index < colors.length; index++) {
      const r = colors[index][0];
      const g = colors[index][1];
      const b = colors[index][2];
      this.rgb[cnt++] = r;
      this.rgb[cnt++] = g;
      this.rgb[cnt++] = b;
      this.colors[index] = `rgb(${r}, ${g}, ${b})`;
      this.abgr[index] = 0xff000000 | (b << 16) | (g << 8) | r;
      this.fl[index] = [r / 256, g / 256, b / 256];
    }
  }

  /*
   * Check if a color is light (closer to white) or dark (closer to black)
   * @param color Index of color in palette
   * @return dark True if color is dark
   */
  isDark(color: number) {
    color *= 3;
    const r = this.rgb[color++];
    const g = this.rgb[color++];
    const b = this.rgb[color];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 128;
  }

  /*
   * Get last matching color index of RGB color
   * @param r r
   * @param g g
   * @param b b
   * @return index of color
   */
  getIndexOfColor(r: number, g: number, b: number): ColorIndex {
    const { rgb } = this;
    let i = rgb.length;
    while (i >= 0) {
      if (rgb[--i] === b && rgb[--i] === g && rgb[--i] === r) {
        return i / 3;
      }
    }
    return null;
  }

  /*
   * Take a buffer of indexed pixels and output it as ABGR Array
   * @param chunkBuffer Buffer of indexed pixels
   * @return ABRG Buffer
   */
  buffer2ABGR(chunkBuffer: Buffer, template: boolean = false): Uint32Array {
    const { length } = chunkBuffer;
    const colors = new Uint32Array(length);
    let value: number;
    const buffer = chunkBuffer;

    let pos = 0;
    for (let i = 0; i < length; i++) {
      value = buffer[i] & 0x3f;
      if (template && value === 0) {
        colors[pos++] = 0x00000000;
      } else {
        colors[pos++] = this.abgr[value];
      }
    }
    return colors;
  }

  /*
   * Take a buffer of indexed pixels and output it as RGB Array
   * @param chunkBuffer Buffer of indexed pixels
   * @return RGB Buffer
   */
  buffer2RGB(chunkBuffer: Buffer): Uint8Array {
    const { length } = chunkBuffer;
    const colors = new Uint8Array(length * 3);
    let color: number;
    let value: number;
    const buffer = chunkBuffer;

    let c = 0;
    for (let i = 0; i < length; i++) {
      value = buffer[i];

      color = (value & 0x3f) * 3;
      colors[c++] = this.rgb[color++];
      colors[c++] = this.rgb[color++];
      colors[c++] = this.rgb[color];
    }
    return colors;
  }

  /*
   * Create a RGB Buffer of a specific size with just one color
   * @param color Color Index of color to use
   * @param length Length of needed Buffer
   * @return RGB Buffer of wanted size with just one color
   */
  oneColorBuffer(color: ColorIndex, length: number) {
    const buffer = new Uint8Array(length * 3);
    const r = this.rgb[color * 3];
    const g = this.rgb[color * 3 + 1];
    const b = this.rgb[color * 3 + 2];
    let pos = 0;
    for (let i = 0; i < length; i++) {
      buffer[pos++] = r;
      buffer[pos++] = g;
      buffer[pos++] = b;
    }

    return buffer;
  }
}

export const COLORS_RGB: Uint8Array = new Uint8Array([
  202,
  227,
  255, // first color is unset pixel in ocean
  255,
  255,
  255, // second color is unset pixel on land
  255,
  255,
  255, // white
  228,
  228,
  228, // light gray
  196,
  196,
  196, // silver
  136,
  136,
  136, // dark gray
  78,
  78,
  78, // darker gray
  0,
  0,
  0, // black
  244,
  179,
  174, // skin
  255,
  167,
  209, // light pink
  255,
  84,
  178, // pink
  255,
  101,
  101, // peach
  229,
  0,
  0, // red
  154,
  0,
  0, // dark red
  254,
  164,
  96, // light brown
  229,
  149,
  0, // orange
  160,
  106,
  66, // brown
  96,
  64,
  40, // dark brown
  245,
  223,
  176, // sand
  255,
  248,
  137, // khaki
  229,
  217,
  0, // yellow
  148,
  224,
  68, // light green
  2,
  190,
  1, // green
  104,
  131,
  56, // olive
  0,
  101,
  19, // dark green
  202,
  227,
  255, // sky blue
  0,
  211,
  221, // light blue
  0,
  131,
  199, // dark blue
  0,
  0,
  234, // blue
  25,
  25,
  115, // darker blue
  207,
  110,
  228, // light violette
  130,
  0,
  128, // violette
]);

export const COLORS_AMOUNT = COLORS_RGB.length / 3;
export const COLORS: Array<Color> = new Array(COLORS_AMOUNT);
export const COLORS_ABGR: Uint32Array = new Uint32Array(COLORS_AMOUNT);
export const TRANSPARENT: ColorIndex = 0;

export default Palette;
