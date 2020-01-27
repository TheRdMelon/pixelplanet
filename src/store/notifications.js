/**
 * Notifications
 *
 * @flow
 */

export default () => (next) => (action) => {
  try {
    switch (action.type) {
      case 'PLACE_PIXEL': {
        if (
          window.Notification
          && Notification.permission !== 'granted'
          && Notification.permission !== 'denied'
        ) {
          Notification.requestPermission();
        }
        break;
      }

      case 'COOLDOWN_END': {
        if (window.Notification && Notification.permission === 'granted') {
          // eslint-disable-next-line no-unused-vars
          const notification = new Notification('Your next pixels are ready', {
            icon: '/tile.png',
            silent: true,
            vibrate: [200, 100],
            body: 'You can now place more on pixelplanet.fun :)',
          });
        }
        break;
      }

      default:
      // nothing
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return next(action);
};
