/**
 * @param {string} _color to fade (hex)
 * @param {number} fadeAmt in [0, 1] amount to fade
 * @returns {string} rgba color with fade
 */
export default function fadeColor(_color, fadeAmt) {
  let color = _color[0] === '#' ? _color.slice(1) : _color;
  if (color.length === 3) color = color.split('').map(s => s + s).join('');
  const c = Array(3);
  for (let i = 0; i < color.length; i += 2) {
    const hex = color.slice(i, i + 2);
    c[i / 2] = parseInt(hex, 16);
  }
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${1 - fadeAmt})`;
}
