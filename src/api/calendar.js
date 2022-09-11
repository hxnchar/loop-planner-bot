import { google } from 'googleapis';
import 'dotenv/config';
import {
  format, differenceInHours, parseISO,
  startOfDay, endOfDay,
} from 'date-fns';
import { createEventsList } from '../services/helpers.js';
import Formats from '../bot-helpers/formats.js';

export const calendar = google.calendar({ version: 'v3' });
const calendar_access = JSON.parse(process.env.CALENDAR_ACCESS);
export const auth = new google.auth.JWT(
  calendar_access.client_email,
  null,
  calendar_access.private_key,
  'https://www.googleapis.com/auth/calendar',
);

export const getEventId = async (calendarId, eventName, date) => {
  const [timeMin, timeMax] = [startOfDay(date), endOfDay(date)];
  const response = (await calendar.events.list({
    auth,
    calendarId,
    timeMin,
    timeMax,
    timeZone: 'Europe/London',
  })).data.items.filter((item) => item.summary === eventName)[0];
  if (!response) {
    throw new Error('No events on this date found');
  }
  return response.id;
};

export const insertEvent = async (calendarId, { ...props }) => {
  const { eventName, startDate, endDate } = props;
  const event = {
    'summary': eventName,
    'start': {
      'dateTime': startDate,
      'timeZone': 'Europe/London',
    },
    'end': {
      'dateTime': endDate,
      'timeZone': 'Europe/London',
    },
  };
  const response = await calendar.events.insert({
    auth,
    calendarId,
    resource: event,
  });
  return response;
};

export const removeEvent = async (calendarId, eventId) => {
  const response = await calendar.events.delete({
    auth,
    calendarId,
    eventId,
  });
  if (response.data) {
    throw new Error('Something went wrong. Does this event even exist?🤨');
  }
  return response;
};

export const showShifts = async (calendarId, { ...props }) => {
  const { eventName, startDate, endDate } = props;
  const response = await calendar.events.list({
    auth,
    calendarId,
    timeMin: startDate,
    timeMax: endDate,
    timeZone: 'Europe/London',
  });
  if (response.data.items.length === 0) {
    throw new Error('No events in this period😕');
  }
  let listOfEvents;
  try {
    listOfEvents = createEventsList(response.data.items, eventName);
  } catch (e) {
    throw new Error(`Error occurred: ${e.message}`);
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
    return `<b>${format(startDateTime, Formats.fullDateLong)}</b>: ` +
        `${format(startDateTime, Formats.time)} - ` +
        `${format(finishDateTime, Formats.time)}`;
  });
  responseText =
    [`There ${countEvents === 1 ? 'is' : 'are'} ` +
      `<b>${countEvents} shift${countEvents === 1 ? '' : 's'}</b> ` +
        `in your calendar:`, ...responseText];
  responseText = responseText.join('\n');
  return responseText;
};

export const monthlyPayment = async (calendarId, wage, { ...props }) => {
  const { eventName, startDate, endDate } = props;
  let response = await calendar.events.list({
    auth,
    calendarId,
    timeMin: startDate,
    timeMax: endDate,
    timeZone: 'Europe/London',
  });
  response = response.data.items.filter((elem) => elem.summary === eventName)
    .map((elem) =>
      differenceInHours(
        parseISO(elem.end.dateTime),
        parseISO(elem.start.dateTime)));
  const hours = response.reduce((acc, elem) => acc + elem);
  return wage * hours;
};
