/**
 *
 * @flow
 */

import getHydrators from './Hydration';

const OP_CODE = 0xb2;

export default {
  OP_CODE,
  ...getHydrators(OP_CODE),
};
