/**
 * Notifications
 *
 * @flow
 */

import Push from 'push.js';

function onGranted() {

}
function onDenied() {

}


export default store => next => (action) => {
  if (!Push.isSupported) return next(action);

  switch (action.type) {
    case 'PLACE_PIXEL': {
      // request permission
      // gives callback error now
      Push.Permission.request(onGranted, onDenied);

      // clear notifications
      Push.clear();
      break;
    }

    case 'COOLDOWN_END': {
      Push.create('Your next pixel is now available', {
        icon: '/tile.png',
        silent: true,
        vibrate: [200, 100],
        onClick() {
          parent.focus();
          window.focus();
          Push.clear();
        },
      });
      break;
    }

    default:
      // nothing
  }

  return next(action);
};
