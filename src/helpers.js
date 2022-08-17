import datefns, { format } from 'date-fns';
import Constants from './constants.js';
import { Shift } from './shift.js';

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

export const checkAllDaysPicked = (keyboard) => {
  for (let i = 0; i < keyboard.length - 1; i++) {
    for (let j = 0; j < keyboard[i].length; j++) {
      if (!(keyboard[i][j].text.startsWith(Constants.DAY_SYMBOL) ||
      keyboard[i][j].text.startsWith(Constants.NIGHT_SYMBOL))) {
        return false;
      }
    }
  }
  return true;
};

export const generateList = (keyboard) => {
  const list = [];
  for (let i = 0; i < keyboard.length - 1; i++) {
    for (let j = 0; j < keyboard[i].length; j++) {
      const date = keyboard[i][j].text.slice(-5);
      let time;
      const morningShift = keyboard[i][j].text.includes(Constants.DAY_SYMBOL);
      if (morningShift) {
        //TODO get from db
        time = new Date().getHours();
      } else {
        time = new Date().getHours();
      }
      list.push(new Shift(date, time, datefns.addHours(time, 8).getHours()));
    }
  }
  return list;
};
