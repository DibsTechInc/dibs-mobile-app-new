const quotes = [
  'If only taking vitamins could be classified as working out',
  'Preparing the treadmills...',
  'Generating personal trainers...',
  'Gym mode activated',
  'Dispatching protein shakes...',
  'Exercise. Not extra fries',
  'I lift, therefore I am',
  'Let she who lacks pump do the first set',
  'The first lift is getting off the couch',
  'If you’re on the treadmill next to me, we are racing',
  'You can be sore tomorrow or sorry tomorrow. You decide',
  'Do the work, be the prize',
  'Caution: Contains Gains',
  'The faster you run, the sooner you\'re done',
  'You can\'t beat science',
  'Something something oats and squats',
  'Shut up and squat',
  'Rock that post-workout glow',
  'Spin to win',
  'Every day you don\'t work out, someone else does',
  'Gym, tan, laundry',
  'Motivation is fleeting. Discipline is not.',
  'The body achieves what the mind believes.',
];

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
  const randomIndex = getRandomIntInclusive(0, quotes.length - 1);
  return quotes[randomIndex];
}

