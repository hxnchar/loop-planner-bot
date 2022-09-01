import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
const calendar = google.calendar({ version: 'v3' });
const calendar_access = JSON.parse(process.env.CALENDAR_ACCESS);
const auth = new google.auth.JWT(
  calendar_access.client_email,
  null,
  calendar_access.private_key,
  'https://www.googleapis.com/auth/calendar',
);

export { calendar, auth };
