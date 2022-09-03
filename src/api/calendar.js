import { google } from 'googleapis';
import dotenv from 'dotenv';
import datefns from 'date-fns';
dotenv.config();
export const calendar = google.calendar({ version: 'v3' });
const calendar_access = JSON.parse(process.env.CALENDAR_ACCESS);
export const auth = new google.auth.JWT(
  calendar_access.client_email,
  null,
  calendar_access.private_key,
  'https://www.googleapis.com/auth/calendar',
);

export const getEventId = async (calendarId, eventName, date) => {
  const [timeMin, timeMax] = [datefns.startOfDay(date), datefns.endOfDay(date)];
  const response = (await calendar.events.list({
    auth,
    calendarId,
    timeMin,
    timeMax,
    timeZone: 'Europe/London',
  })).data.items.filter((item) => item.summary === eventName)[0];
  return response.id;
};

export const updateEvent = async (calendarId, eventId, options) => {
  const oldEvent = await calendar.events.get({
    auth,
    calendarId,
    eventId,
  });
  const updatedEvent = {
    'summary': options.eventName || oldEvent.eventName,
    'start': {
      'dateTime': options.startDate || oldEvent.startDate,
      'timeZone': 'Europe/London',
    },
    'end': {
      'dateTime': options.endDate || oldEvent.endDate,
      'timeZone': 'Europe/London',
    },
  };
  const response = await calendar.events.update({
    auth,
    calendarId,
    eventId,
    resourse: updatedEvent,
  });
  console.log(response);
  return 'Event updated succesfully';
};

export const removeEvent = async (calendarId, eventId) => {
  const response = await calendar.events.delete({
    auth,
    calendarId,
    eventId,
  });
  if (response.data) {
    return 'Something went wrong. Does this event even exist?🤨';
  }
  return 'Event removed succesfully';
};
