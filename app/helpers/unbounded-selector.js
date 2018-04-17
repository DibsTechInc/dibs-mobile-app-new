import { createSelectorCreator } from 'reselect';
import _ from 'lodash';

/**
 * hashFn - Description
 *
 * @param {array} args Description
 *
 * @returns {type} Description
 */
function hashFn(...args) {
  return args.reduce(
    (acc, val) => `${acc}-${JSON.stringify(val)}`,
    ''
  );
}

export default createSelectorCreator(_.memoize, hashFn);
