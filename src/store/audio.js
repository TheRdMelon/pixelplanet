/* @flow
 *
 * play sounds using the HTML5 AudoContext
 *
 * */

// iPhone needs this
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

export default (store) => (next) => (action) => {
  const state = store.getState();
  const { mute, chatNotify } = state.audio;

  switch (action.type) {
    case 'SELECT_COLOR': {
      if (mute) break;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      oscillatorNode.detune.value = -600;

      oscillatorNode.frequency.setValueAtTime(600, context.currentTime);
      oscillatorNode.frequency.setValueAtTime(700, context.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        context.currentTime + 0.1,
      );

      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      oscillatorNode.stop(context.currentTime + 0.2);
      break;
    }

    case 'PIXEL_WAIT': {
      if (mute) break;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      // oscillatorNode.detune.value = -600

      oscillatorNode.frequency.setValueAtTime(1479.98, context.currentTime);
      oscillatorNode.frequency.exponentialRampToValueAtTime(
        493.88,
        context.currentTime + 0.01,
      );

      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        context.currentTime + 0.1,
      );

      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      oscillatorNode.stop(context.currentTime + 0.1);
      break;
    }

    case 'PIXEL_FAILURE': {
      if (mute) break;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      oscillatorNode.detune.value = -900;
      oscillatorNode.frequency.setValueAtTime(600, context.currentTime);
      oscillatorNode.frequency.setValueAtTime(
        1400,
        context.currentTime + 0.025,
      );
      oscillatorNode.frequency.setValueAtTime(1200, context.currentTime + 0.05);
      oscillatorNode.frequency.setValueAtTime(900, context.currentTime + 0.075);

      const lfo = context.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 2.0;
      lfo.connect(gainNode.gain);
      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      lfo.start();
      oscillatorNode.stop(context.currentTime + 0.3);
      break;
    }

    case 'PLACE_PIXEL': {
      if (mute) break;
      const { color } = action;
      const { palette } = state.canvas;
      const colorsAmount = palette.colors.length;

      const clrFreq = 100 + Math.log(color / colorsAmount + 1) * 300;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(clrFreq, context.currentTime);
      oscillatorNode.frequency.exponentialRampToValueAtTime(
        1400,
        context.currentTime + 0.2,
      );

      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        context.currentTime + 0.1,
      );

      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      oscillatorNode.stop(context.currentTime + 0.1);
      break;
    }

    case 'COOLDOWN_END': {
      if (mute) break;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(349.23, context.currentTime);
      oscillatorNode.frequency.setValueAtTime(
        523.25,
        context.currentTime + 0.1,
      );
      oscillatorNode.frequency.setValueAtTime(
        698.46,
        context.currentTime + 0.2,
      );

      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.2,
        context.currentTime + 0.15,
      );

      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      oscillatorNode.stop(context.currentTime + 0.3);
      break;
    }

    case 'RECEIVE_CHAT_MESSAGE': {
      if (!chatNotify) break;
      const oscillatorNode = context.createOscillator();
      const gainNode = context.createGain();

      oscillatorNode.type = 'sine';
      oscillatorNode.frequency.setValueAtTime(310, context.currentTime);
      oscillatorNode.frequency.exponentialRampToValueAtTime(
        355,
        context.currentTime + 0.025,
      );

      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.1,
        context.currentTime + 0.1,
      );

      oscillatorNode.connect(gainNode);
      gainNode.connect(context.destination);

      oscillatorNode.start();
      oscillatorNode.stop(context.currentTime + 0.075);
      break;
    }

    default:
    // nothing
  }

  return next(action);
};
