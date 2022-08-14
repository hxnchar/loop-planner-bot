import { format } from 'date-fns';

export const dateToShortMsg = (date) =>
  `${new Date(date).getDate()}${format(new Date(date), 'MMM').toUpperCase()}`;

export const dateToLongMsg = (date) =>
  `[${format(new Date(date), 'EEEE').slice(0, 3).toUpperCase()}]` +
  `${new Date(date).getDate()}${format(new Date(date), 'MMM').toUpperCase()}`;
