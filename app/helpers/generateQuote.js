import Config from '../../config.json';

let previousIndex = null;

/**
 * @param {number} n first possible index to consider
 * @param {number} m last possible index
 * @returns {number} random int in [n, m]
 */
function getRandomIntInclusive(n, m) {
  const min = Math.ceil(n);
  const max = Math.floor(m);
  const randomIndex = Math.floor(Math.random() * (max - (min + 1))) + min;

  if (previousIndex !== randomIndex) {
    previousIndex = randomIndex;
  } else {
    getRandomIntInclusive(min, max);
  }

  return randomIndex;
}

/**
 * @returns {string} quote to display
 */
export default function generateQuote() {
  if (!Config.LOADING_QUOTES?.length) return '';
  const randomIndex = getRandomIntInclusive(0, Config.LOADING_QUOTES?.length + 1);
  return Config.LOADING_QUOTES[randomIndex];
}

