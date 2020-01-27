/*
 *
 * Notification when someone places a pixel nearby
 * Red increasing circle.
 *
 * @flow
 */

import type { State } from '../reducers';

import { clamp, worldToScreen } from '../core/utils';

class PixelNotify {
  static NOTIFICATION_TIME = 1100;

  scale: number;
  notifcircle: HTMLCanvasElement;
  notificationRadius: number;
  pixelList: Array;

  constructor() {
    // initialise notification circle image
    // (rendering the circle on a offscreen canvas and then putting this
    //  on the canvas is faster than drawing it every time)
    this.pixelList = [];
    this.notificationRadius = 150;
    this.notifcircle = document.createElement('canvas');
    this.notifcircle.width = 200;
    this.notifcircle.height = 200;
    const notifcontext = this.notifcircle.getContext('2d');
    if (!notifcontext) return;

    notifcontext.fillStyle = '#FF000055';
    notifcontext.beginPath();
    notifcontext.arc(100, 100, 100, 0, 2 * Math.PI);
    notifcontext.closePath();
    notifcontext.fill();
  }

  addPixel(x: number, y: number) {
    if (this.pixelList.length < 300) {
      this.pixelList.unshift([Date.now(), x, y]);
    }
  }

  doRender() {
    return this.pixelList.length !== 0;
  }

  updateScale(scale: number) {
    this.scale = scale;
    this.notificationRadius = clamp(this.scale * 10, 20, 400);
  }

  render(state: State, $viewport: HTMLCanvasElement) {
    const viewportCtx = $viewport.getContext('2d');
    if (!viewportCtx) return;

    const curTime = Date.now();
    let index = this.pixelList.length;
    while (index > 0) {
      index--;
      const [setTime, x, y] = this.pixelList[index];
      const timePasseded = curTime - setTime;
      if (timePasseded > PixelNotify.NOTIFICATION_TIME) {
        this.pixelList.pop();
        continue;
      }
      const [sx, sy] = worldToScreen(state, $viewport, [x, y]).map(
        (z) => z + this.scale / 2,
      );

      const notRadius = (timePasseded / PixelNotify.NOTIFICATION_TIME)
        * this.notificationRadius;
      const circleScale = notRadius / 100;
      viewportCtx.save();
      viewportCtx.scale(circleScale, circleScale);
      viewportCtx.drawImage(
        this.notifcircle,
        sx / circleScale - 100,
        sy / circleScale - 100,
      );
      viewportCtx.restore();
    }
  }
}

const pixelNotify = new PixelNotify();

export default pixelNotify;
