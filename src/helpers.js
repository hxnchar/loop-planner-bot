import { format } from 'date-fns';

export const dateToMsg = date => `${new Date(date).getDate()}${format(new Date(date), 'MMM').toUpperCase()}`;
