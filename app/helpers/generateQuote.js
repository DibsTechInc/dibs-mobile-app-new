import Config from '../../config.json';

let previousIndex = null;

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  const randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;

  if (previousIndex !== randomIndex) {
    previousIndex = randomIndex;
  } else {
    getRandomIntInclusive(min, max);
  }

  return randomIndex;
}

export default function generateQuote() {
  const randomIndex = getRandomIntInclusive(0, Config.LOADING_QUOTES.length - 1);
  return Config.LOADING_QUOTES[randomIndex];
}

