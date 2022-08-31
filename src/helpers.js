import datefns, { format } from 'date-fns';
import Constants from './constants.js';
import { Shift } from './shift.js';
import Time from './time.js';

export const dateToShortMsg = (date) => {
  const parsedDate = new Date(date);
  return `${parsedDate.getDate()}${format(parsedDate, 'MMM').toUpperCase()}`;
};

export const dateToLongMsg = (date) => {
  const parsedDate = new Date(date);
  return `[${format(parsedDate, 'EEEEEE').toUpperCase()}] ` +
  `${parsedDate.getDate()}${format(parsedDate, 'MMM').toUpperCase()}`;
};

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

export const generateList = (keyboard, preferences) => {
  const list = [];
  const [firstShiftStart, secondShiftStart] =
  [
    Time.parse(preferences.firstShiftStart),
    Time.parse(preferences.secondShiftStart),
  ];
  const timeMargin = Time.parse(preferences.duration);
  const [firstShiftEnd, secondShiftEnd] =
  [
    firstShiftStart.add(timeMargin),
    secondShiftStart.add(timeMargin),
  ];
  for (let i = 0; i < keyboard.length - 1; i++) {
    for (let j = 0; j < keyboard[i].length; j++) {
      const date = keyboard[i][j].text.slice(-5);
      const firstShift = keyboard[i][j].text.includes(Constants.DAY_SYMBOL);
      const [shiftStart, shiftEnd] =
        firstShift
          ? [firstShiftStart, firstShiftEnd]
          : [secondShiftStart, secondShiftEnd];
      list.push(new Shift(date, shiftStart, shiftEnd));
    }
  }
  return list;
};

export const genShiftPair = (shift) => {
  let date = shift.date.trim();
  if (shift.timeEnd.nextDay) {
    date = datefns.format(
      datefns.addDays(
        datefns.parse(date, 'dLLL', new Date()), 1), 'dLLL').toUpperCase();
  }
  const shiftStart = `${date} ${shift.timeStart}`;
  const shiftEnd = `${date} ${shift.timeEnd}`;
  return [shiftStart, shiftEnd];
};
