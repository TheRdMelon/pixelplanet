/*
 * @flow
 */

import swal from 'sweetalert2';

export default () => (next) => (action) => {
  switch (action.type) {
    case 'ALERT': {
      const {
        title,
        text,
        icon,
        confirmButtonText,
      } = action;
      swal.fire({
        title,
        text,
        icon,
        confirmButtonText,
      });
      break;
    }

    default:
      // nothing
  }

  return next(action);
};
