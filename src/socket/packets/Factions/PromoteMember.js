/**
 *
 * @flow
 */

import getHydrators from './Hydration';

const OP_CODE = 0xb1;

export default {
  OP_CODE,
  ...getHydrators(OP_CODE),
};
