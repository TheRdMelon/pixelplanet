/*
 * Manage renderers and switch between them
 * A renderer will create it's own viewport and append it
 * to document.body.
 *
 * @flow
 */

import Renderer2D from './Renderer2D';

let renderer = {
  render: () => null,
  destructor: () => null,
  renderPixel: () => null,
  updateCanvasData: () => null,
};

function animationLoop() {
  renderer.render();
  window.requestAnimationFrame(animationLoop);
}
animationLoop();

export async function initRenderer(store, is3D: boolean) {
  renderer.destructor();
  if (is3D) {
    /* eslint-disable-next-line max-len */
    const module = await import(/* webpackChunkName: "voxel" */ '../ui/Renderer3D');
    const Renderer3D = module.default;
    renderer = new Renderer3D(store);
  } else {
    renderer = new Renderer2D(store);
  }
  return renderer;
}

export function getRenderer() {
  return renderer;
}
