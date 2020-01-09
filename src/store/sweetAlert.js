/*
 * @flow
 */

import swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';

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
