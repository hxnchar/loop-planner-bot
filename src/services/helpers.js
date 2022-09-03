import datefns, { format } from 'date-fns';
import Constants from '../bot-helpers/constants.js';
import Formats from '../bot-helpers/formats.js';
import { Shift } from '../libs/shift.js';
import Time from '../libs/time.js';

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
      const date = keyboard[i][j].text.split(' ')[1];
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
        datefns.parse(
          date,
          Formats.dateMonth,
          new Date()), 1),
      Formats.dateMonth).toUpperCase();
  }
  const shiftStart = `${date} ${shift.timeStart}`;
  const shiftEnd = `${date} ${shift.timeEnd}`;
  return [shiftStart, shiftEnd];
};

export const createEventsList = (eventsArray, eventName) => {
  eventsArray = eventsArray.filter((event) =>
    event.summary === eventName);
  eventsArray = eventsArray
    .map((event) => {
      event.start.dateTime = datefns.parseISO(event.start.dateTime);
      event.end.dateTime = datefns.parseISO(event.end.dateTime);
      return new Object({ data: event, isEvent: true });
    });
  if (eventsArray.length === 0) {
    throw new Error('No suitable events in this interval');
  }
  eventsArray = eventsArray.sort((event1, event2) =>
    event1.data.start.dateTime - event2.data.start.dateTime);
  const currentDate = new Date();
  let indexToInsert;
  if (currentDate < eventsArray[0].data.start.dateTime) {
    indexToInsert = 0;
  } else if (currentDate >
      eventsArray[eventsArray.length - 1].data.start.dateTime) {
    indexToInsert = eventsArray.length - 1;
  } else {
    for (let i = 1; i < eventsArray.length - 1; i++) {
      if (eventsArray[i - 1].data.start.dateTime < currentDate &&
        currentDate < eventsArray[i].data.start.dateTime) indexToInsert = i;
    }
  }
  eventsArray.splice(indexToInsert, 0,
    new Object({ data: '<i>————— now —————</i>', isEvent: false }));
  return eventsArray;
};

export const showShifts = async ({ ...props }) => {
  const { calendar, auth, calendarId, chatId, eventName } = props;
  const response = await calendar.events.list({
    auth,
    calendarId,
    timeMin: props.startDate,
    timeMax: props.endDate,
    timeZone: 'Europe/London',
  });
  if (response.data.items.length === 0) {
    return props.bot.sendMessage(chatId,
      'No events in this period😕');
  }
  let listOfEvents;
  try {
    listOfEvents = createEventsList(response.data.items, eventName);
  } catch (e) {
    return props.bot.sendMessage(chatId, e.message);
  }
  const countEvents = listOfEvents.length - 1;
  let responseText = listOfEvents.map((event) => {
    if (!event.isEvent) {
      return `<i>${event.data}</i>`;
    }
    const [startDateTime, finishDateTime] = [
      event.data.start.dateTime,
      event.data.end.dateTime,
    ];
    return `<b>${datefns
      .format(startDateTime, Formats.fullDateLong)}</b>: ` +
        `${datefns.format(startDateTime, Formats.time)} - ` +
        `${datefns.format(finishDateTime, Formats.time)}`;
  });
  responseText =
    [`There ${countEvents === 1 ? 'is' : 'are'} ` +
      `<b>${countEvents} shift${countEvents === 1 ? '' : 's'}</b> ` +
        `in your calendar:`, ...responseText];
  responseText = responseText.join('\n');
  return props.bot.sendMessage(chatId, responseText, {
    parse_mode: 'HTML',
  });
};

