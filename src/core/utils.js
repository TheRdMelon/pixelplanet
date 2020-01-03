/* @flow */

import type { Cell } from './Cell';
import type { State } from '../reducers';

import { TILE_SIZE, TILE_ZOOM_LEVEL } from './constants';

/**
 * http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
 * @param n
 * @param m
 * @returns {number} remainder
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function distMax([x1, y1]: Cell, [x2, y2]: Cell): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export function getChunkOfPixel(pixel: Cell, canvasSize: number = null): Cell {
  const target = pixel.map(x => Math.floor((x + (canvasSize / 2)) / TILE_SIZE));
  return target;
}

export function getTileOfPixel(tileScale: number, pixel: Cell, canvasSize: number = null): Cell {
  const target = pixel.map(x => Math.floor((x + canvasSize / 2) / TILE_SIZE * tileScale));
  return target;
}

export function getMaxTiledZoom(canvasSize: number): number {
  if (!canvasSize) return 0;
  return Math.log2(canvasSize / TILE_SIZE) / TILE_ZOOM_LEVEL * 2;
}

export function getCanvasBoundaries(canvasSize: number): number {
  const canvasMinXY = -canvasSize / 2;
  const canvasMaxXY = canvasSize / 2 - 1;
  return [canvasMinXY, canvasMaxXY];
}

export function getOffsetOfPixel(x: number, y: number, canvasSize: number = null): number {
  const modOffset = mod((canvasSize / 2), TILE_SIZE);
  const cx = mod(x + modOffset, TILE_SIZE);
  const cy = mod(y + modOffset, TILE_SIZE);
  return (cy * TILE_SIZE) + cx;
}

/*
 * Searches Object for element with ident string and returns its key
 * Used for getting canvas id from given ident-string (see canvases.json)
 * @param obj Object
 * @param ident ident string
 * @return key
 */
export function getIdFromObject(obj: Object, ident: string): number {
  const ids = Object.keys(obj);
  for (let i = 0; i < ids.length; i += 1) {
    const key = ids[i];
    if (obj[key].ident === ident) {
      return parseInt(key, 10);
    }
  }
  return null;
}

export function getPixelFromChunkOffset(
  i: number,
  j: number,
  offset: number,
  canvasSize: number,
): Cell {
  const cx = mod(offset, TILE_SIZE);
  const cy = Math.floor(offset / TILE_SIZE);
  const devOffset = canvasSize / 2 / TILE_SIZE;
  const x = ((i - devOffset) * TILE_SIZE) + cx;
  const y = ((j - devOffset) * TILE_SIZE) + cy;
  return [x, y];
}

export function getCellInsideChunk(pixel: Cell): Cell {
  // TODO assert is positive!
  return pixel.map(x => mod(x, TILE_SIZE));
}

export function screenToWorld(
  state: State,
  $viewport: HTMLCanvasElement,
  [x, y]: Cell,
): Cell {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    Math.floor(((x - (width / 2)) / viewscale) + viewX),
    Math.floor(((y - (height / 2)) / viewscale) + viewY),
  ];
}

export function worldToScreen(
  state: State,
  $viewport: HTMLCanvasElement,
  [x, y]: Cell,
): Cell {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    ((x - viewX) * viewscale) + (width / 2),
    ((y - viewY) * viewscale) + (height / 2),
  ];
}

/*
 * Get Color Index of specific pixel
 * @param state State
 * @param viewport Viewport HTML canvas
 * @param coordinates  Coords of pixel in World coordinates
 * @return number of color Index
 */
export function getColorIndexOfPixel(
  state: State,
  coordinates: Cell,
): number {
  const { chunks, canvasSize, canvasMaxTiledZoom } = state.canvas;
  const [cx, cy] = getChunkOfPixel(coordinates, canvasSize);
  const key = `${canvasMaxTiledZoom}:${cx}:${cy}`;
  const chunk = chunks.get(key);
  if (!chunk) {
    return 0;
  }
  return chunk.getColorIndex(
    getCellInsideChunk(coordinates),
  );
}

export function durationToString(
  ms: number,
  smallest: boolean = false,
): string {
  const seconds = Math.floor(ms / 1000);
  let timestring: string;
  if (seconds < 60 && smallest) {
    timestring = seconds;
  } else {
    timestring = `${Math.floor(seconds / 60)}:${(`0${seconds % 60}`).slice(-2)}`;
  }
  return timestring;
}

const postfix = ['k', 'm', 'M'];
export function numberToString(num: number): string {
  if (!num) {
    return 'N/A';
  }
  if (num < 1000) {
    return num;
  }
  let postfixNum = 0;
  while (postfixNum < postfix.length) {
    if (num < 10000) {
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 10)}${postfix[postfixNum]}`;
    } else if (num < 100000) {
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 100)}${postfix[postfixNum]}`;
    } else if (num < 1000000) {
      return Math.floor(num / 1000) + postfix[postfixNum];
    }
    postfixNum += 1;
    num = Math.round(num / 1000);
  }
  return '';
}

export function numberToStringFull(num: number): string {
  if (num < 0) {
    return `${num} :-(`;
  } else if (num < 1000) {
    return num;
  } else if (num < 1000000) {
    return `${Math.floor(num / 1000)}.${(`00${num % 1000}`).slice(-3)}`;
  }

  return `${Math.floor(num / 1000000)}.${(`00${Math.floor(num / 1000)}`).slice(-3)}.${(`00${num % 1000}`).slice(-3)}`;
}

export function colorFromText(str: string) {
  if (!str) return '#000000';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
}

const linkRegExp = /(#[a-z]*,-?[0-9]*,-?[0-9]*(,-?[0-9]+)?)/gi;
export function splitCoordsInString(text) {
  const arr = text
    .split(linkRegExp)
    .filter((val, ind) => ((ind % 3) !== 2));
  return arr;
}
