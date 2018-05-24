const quotes = [
  'If only taking vitamins could be classified as working out',
  'Preparing the treadmills...',
  'Generating personal trainers...',
  'Gym mode activated',
  'Dispatching protein shakes...',
  'Exercise. Not extra fries',
  'I lift, therefore I am',
  'Let she who lacks pump do the first set',
  'You can\'t push yourself forward by patting yourself on the back',
  'If you’re on the treadmill next to me, we are racing.',
  'You can be sore tomorrow or sorry tomorrow. You decide.',
  'Do the work, be the prize',
  'Caution: Contains Gains',
];

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function generateQuote() {
  const randomIndex = getRandomIntInclusive(0, quotes.length - 1);
  return quotes[randomIndex];
}

