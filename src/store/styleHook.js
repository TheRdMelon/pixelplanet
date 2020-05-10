/*
 * @flow
 */

import setStyle from '../ui/setStyle';

export default () => (next) => (action) => {
  switch (action.type) {
    case 'SELECT_STYLE': {
      const {
        style,
      } = action;
      setStyle(style);
      break;
    }

    default:
      // nothing
  }

  return next(action);
};
