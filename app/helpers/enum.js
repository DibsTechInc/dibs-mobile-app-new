/**
 * @param {Array<string>} keys for enumerable type
 * @returns {Object} enum obj
 */
export default function Enum(keys) {
  return keys.reduce((acc, e, i) => {
    acc[e] = i;
    return acc;
  }, {});
}
