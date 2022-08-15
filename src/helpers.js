import { format } from 'date-fns';

export const dateToShortMsg = (date) =>
  `${new Date(date).getDate()}${format(new Date(date), 'MMM').toUpperCase()}`;

export const dateToLongMsg = (date) =>
  `[${format(new Date(date), 'EEEE').slice(0, 3).toUpperCase()}]` +
  `${new Date(date).getDate()}${format(new Date(date), 'MMM').toUpperCase()}`;

export const getDaysFromKeyboard = (keyboard) => {
  const res = [];
  for (let i = 0; i < keyboard.length; i++) {
    for (let j = 0; j < keyboard[i].length; j++) {
      if (keyboard[i][j].text && keyboard[i][j].text.startsWith('✅')) {
        res.push(keyboard[i][j].text.split(']')[1]);
      }
    }
  }
  if (res.length === 0) {
    throw new Error('You didn`t provide any dates');
  }
  return res;
};
