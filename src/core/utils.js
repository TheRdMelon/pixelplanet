/* @flow */

import type { Cell } from './Cell';
import type { State } from '../reducers';

import { TILE_SIZE, THREE_TILE_SIZE, TILE_ZOOM_LEVEL } from './constants';

/**
 * http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
 * @param n
 * @param m
 * @returns {number} remainder
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/*
 * returns random integer
 * @param min Minimum of random integer
 * @param max Maximum of random integer
 * @return random integer between min and max (min <= ret <= max)
 */
export function getRandomInt(min, max) {
  const range = max - min + 1;
  return min + Math.floor(Math.random() * range);
}

export function distMax([x1, y1]: Cell, [x2, y2]: Cell): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export function getChunkOfPixel(
  canvasSize: number,
  x: number,
  y: number,
  z: number = null,
): Cell {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  const cx = Math.floor((x + (canvasSize / 2)) / tileSize);
  const cy = Math.floor((width + (canvasSize / 2)) / tileSize);
  return [cx, cy];
}

export function getTileOfPixel(
  tileScale: number,
  pixel: Cell,
  canvasSize: number = null,
): Cell {
  // eslint-disable-next-line max-len
  const target = pixel.map((x) => Math.floor(((x + canvasSize / 2) / TILE_SIZE) * tileScale));
  return target;
}

export function getMaxTiledZoom(canvasSize: number): number {
  if (!canvasSize) return 0;
  return (Math.log2(canvasSize / TILE_SIZE) / TILE_ZOOM_LEVEL) * 2;
}

export function getCanvasBoundaries(canvasSize: number): number {
  const canvasMinXY = -canvasSize / 2;
  const canvasMaxXY = canvasSize / 2 - 1;
  return [canvasMinXY, canvasMaxXY];
}

// z is assumed to be height here
// in ui and rendeer, y is height
export function getOffsetOfPixel(
  canvasSize: number = null,
  x: number,
  y: number,
  z: number = null,
): number {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  let offset = (z === null) ? 0 : (y * tileSize * tileSize);
  const modOffset = mod((canvasSize / 2), tileSize);
  const cx = mod(x + modOffset, tileSize);
  const cy = mod(width + modOffset, tileSize);
  offset += (cy * tileSize) + cx;
  return offset;
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
  const x = (i - devOffset) * TILE_SIZE + cx;
  const y = (j - devOffset) * TILE_SIZE + cy;
  return [x, y];
}

export function getCellInsideChunk(pixel: Cell): Cell {
  // TODO assert is positive!
  return pixel.map((x) => mod(x, TILE_SIZE));
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
    Math.floor((x - width / 2) / viewscale + viewX),
    Math.floor((y - height / 2) / viewscale + viewY),
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
    (x - viewX) * viewscale + width / 2,
    (y - viewY) * viewscale + height / 2,
  ];
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
    timestring = `${Math.floor(seconds / 60)}:${`0${seconds % 60}`.slice(-2)}`;
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
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 10)}${
        postfix[postfixNum]
      }`;
    }
    if (num < 100000) {
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 100)}${
        postfix[postfixNum]
      }`;
    }
    if (num < 1000000) {
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
  }
  if (num < 1000) {
    return num;
  } if (num < 1000000) {
    return `${Math.floor(num / 1000)}.${(`00${String(num % 1000)}`).slice(-3)}`;
  }

  // eslint-disable-next-line max-len
  return `${Math.floor(num / 1000000)}.${(`00${String(Math.floor(num / 1000))}`).slice(-3)}.${(`00${String(num % 1000)}`).slice(-3)}`;
}

export function colorFromText(str: string) {
  if (!str) return '#000000';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00ffffff).toString(16).toUpperCase();

  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
}

const linkRegExp = /(#[a-z]*,-?[0-9]*,-?[0-9]*(,-?[0-9]+)?)/gi;
export function splitCoordsInString(text) {
  const arr = text.split(linkRegExp).filter((val, ind) => ind % 3 !== 2);
  return arr;
}

export function requestAnimationFrames(frames: number) {
  return new Promise((resolve) => {
    let frameId;
    let i = 0;
    function requestFrame() {
      if (++i === frames) {
        window.cancelAnimationFrame(frameId);
        resolve();
      } else {
        frameId = window.requestAnimationFrame(requestFrame);
      }
    }
    window.requestAnimationFrame(requestFrame);
  });
}

export function mouseDistanceFromElement(mouseEvent, element) {
  const $n = element;
  const mX = mouseEvent.pageX;
  const mY = mouseEvent.pageY;
  const from = {
    x: mX,
    y: mY,
  };
  const off = $n.getBoundingClientRect();
  const ny1 = off.top + document.body.scrollTop; // top
  const ny2 = ny1 + $n.offsetHeight; // bottom
  const nx1 = off.left + document.body.scrollLeft; // left
  const nx2 = nx1 + $n.offsetWidth; // right
  const maxX1 = Math.max(mX, nx1);
  const minX2 = Math.min(mX, nx2);
  const maxY1 = Math.max(mY, ny1);
  const minY2 = Math.min(mY, ny2);
  const intersectX = minX2 >= maxX1;
  const intersectY = minY2 >= maxY1;
  const to = {
    // eslint-disable-next-line no-nested-ternary
    x: intersectX ? mX : nx2 < mX ? nx2 : nx1,
    // eslint-disable-next-line no-nested-ternary
    y: intersectY ? mY : ny2 < mY ? ny2 : ny1,
  };
  const distX = to.x - from.x;
  const distY = to.y - from.y;
  const hypot = (distX ** 2 + distY ** 2) ** (1 / 2);
  return Math.floor(hypot); // this will output 0 when next to your element.
}

export function joinOnId(arr1, arr2, on) {
  const ids = [...new Set([...arr1, ...arr2].map((i) => i[on]))];
  return ids.map((id) => ({
    ...(arr1.find((i) => i[on] === id) || {}),
    ...(arr2.find((i) => i[on] === id) || {}),
  }));
}
