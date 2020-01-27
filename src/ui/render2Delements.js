/*
 * placeholder that shows underneach cursor
 *
 * @flow
 */

import type { State } from '../reducers';
import { screenToWorld, worldToScreen } from '../core/utils';

const PLACEHOLDER_SIZE = 1.2;
const PLACEHOLDER_BORDER = 1;

export function renderPlaceholder(
  state: State,
  $viewport: HTMLCanvasElement,
  scale: number,
) {
  const viewportCtx = $viewport.getContext('2d');

  const { selectedColor, hover } = state.gui;
  const { palette } = state.canvas;

  const [sx, sy] = worldToScreen(state, $viewport, hover);

  viewportCtx.save();
  viewportCtx.translate(sx + scale / 2, sy + scale / 2);
  const angle = Math.sin(Date.now() / 250) / 4;
  viewportCtx.rotate(angle);
  viewportCtx.fillStyle = '#000';
  viewportCtx.fillRect(
    -(scale * (PLACEHOLDER_SIZE / 2)) - PLACEHOLDER_BORDER,
    -(scale * (PLACEHOLDER_SIZE / 2)) - PLACEHOLDER_BORDER,
    scale * PLACEHOLDER_SIZE + 2 * PLACEHOLDER_BORDER,
    scale * PLACEHOLDER_SIZE + 2 * PLACEHOLDER_BORDER,
  );
  viewportCtx.fillStyle = palette.colors[selectedColor];
  viewportCtx.fillRect(
    -scale * (PLACEHOLDER_SIZE / 2),
    -scale * (PLACEHOLDER_SIZE / 2),
    scale * PLACEHOLDER_SIZE,
    scale * PLACEHOLDER_SIZE,
  );
  viewportCtx.restore();
}

export function renderPotatoPlaceholder(
  state: State,
  $viewport: HTMLCanvasElement,
  scale: number,
) {
  const viewportCtx = $viewport.getContext('2d');

  const { selectedColor, hover } = state.gui;
  const { palette } = state.canvas;

  const [sx, sy] = worldToScreen(state, $viewport, hover);

  viewportCtx.save();
  viewportCtx.fillStyle = '#000';
  viewportCtx.fillRect(sx - 1, sy - 1, 4, scale + 2);
  viewportCtx.fillRect(sx - 1, sy - 1, scale + 2, 4);
  viewportCtx.fillRect(sx + scale - 2, sy - 1, 4, scale + 2);
  viewportCtx.fillRect(sx - 1, sy + scale - 2, scale + 1, 4);
  viewportCtx.fillStyle = palette.colors[selectedColor];
  viewportCtx.fillRect(sx, sy, 2, scale);
  viewportCtx.fillRect(sx, sy, scale, 2);
  viewportCtx.fillRect(sx + scale - 1, sy, 2, scale);
  viewportCtx.fillRect(sx, sy + scale - 1, scale, 2);
  viewportCtx.restore();
}

export function renderGrid(
  state: State,
  $viewport: HTMLCanvasElement,
  scale: number,
  isLightGrid: boolean,
) {
  const { width, height } = $viewport;

  const viewportCtx = $viewport.getContext('2d');
  if (!viewportCtx) return;

  viewportCtx.globalAlpha = 0.5;
  viewportCtx.fillStyle = isLightGrid ? '#DDDDDD' : '#222222';

  let [xoff, yoff] = screenToWorld(state, $viewport, [0, 0]);
  let [x, y] = worldToScreen(state, $viewport, [xoff, yoff]);

  for (; x < width; x += scale) {
    const thick = xoff++ % 10 === 0 ? 2 : 1;
    viewportCtx.fillRect(x, 0, thick, height);
  }

  for (; y < height; y += scale) {
    const thick = yoff++ % 10 === 0 ? 2 : 1;
    viewportCtx.fillRect(0, y, width, thick);
  }

  viewportCtx.globalAlpha = 1;
}
