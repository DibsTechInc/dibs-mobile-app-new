/**
 * @param {string} color to change
 * @param {number} amount in [-100, 100] amount to lighten (positive) or darken (negative)
 * @returns {string} modified color
 */
function lightenDarkenColor(color, amount) {
  let usePound = false;

  if (color[0] === '#') {
    color = color.slice(1);
    usePound = true;
  }
  if (color.length === 3) color = color.split('').map(s => s + s).join('');

  const num = parseInt(color, 16);

  let r = (num >> 16) + amount;

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  let b = ((num >> 8) & 0x00FF) + amount;

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  let g = (num & 0x0000FF) + amount;

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  let colorStr = (g | (b << 8) | (r << 16)).toString(16);
  if (colorStr.length < 6) colorStr = `${[...Array(6 - colorStr.length)].map(() => '0').join('')}${colorStr}`;

  return (usePound ? '#' : '') + colorStr;
}

export default lightenDarkenColor;
