import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import datefns from 'date-fns';
import axios from 'axios';
import {
  checkAllDaysPicked,
  dateToShortMsg, generateList,
  getDaysFromKeyboard,
  genShiftPair,
  createEventsList,
} from './helpers.js';
import InlineKeyboards from './inline-keyboards.js';
import Commands from './commands.js';
import Constants from './constants.js';
import mongoose from 'mongoose';
import { google } from 'googleapis';
import User from './models/User.js';
import Settings from './settings.js';
import Time from './time.js';
dotenv.config();
const calendar = google.calendar({ version: 'v3' });
const calendar_access = JSON.parse(process.env.CALENDAR_ACCESS);
const auth = new google.auth.JWT(
  calendar_access.client_email,
  null,
  calendar_access.private_key,
  'https://www.googleapis.com/auth/calendar',
);
let NEW_EVENT_NAME_INPUT = false;
let NEW_EVENT_DURATION_INPUT = false;
let FIRST_SHIFT_START_INPUT = false;
let SECOND_SHIFT_START_INPUT = false;
let NEW_WAGE_INPUT = false;
let NEW_CALENDAR_ID_INPUT = false;
let CHAT_ID;
let MESSAGE_ID;
let settings = new Settings();
let CURRENT_USER;
await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.echufqm.mongodb.net/?retryWrites=true&w=majority`,
  () => {
    console.log('DB connected succsessfully');
  },
  (e) => console.log(e));
const bot = new TelegramApi(process.env.BOT_TOKEN, { polling: true });

await bot.setMyCommands([
  {
    command: Commands.START,
    description: 'Initial command',
  },
  {
    command: Commands.NEW_SHIFTS,
    description: 'Add new shifts to your schedule',
  },
  {
    command: Commands.REMOVE_SHIFTS,
    description: 'Removes shift from your schedule',
  },
  {
    command: Commands.EDIT_SHIFT,
    description: 'Edit your shifts',
  },
  {
    command: Commands.SHOW_SHIFTS,
    description: 'Shows the full list of your shifts',
  },
  {
    command: Commands.SETTINGS,
    description: 'Edit your preferences',
  },
]);

bot.on('message', async (msg) => {
  const [msgTxt, chatId, userID] = [msg.text, msg.chat.id, msg.from.id];
  switch (msgTxt) {
    case Commands.START:
      return bot.sendMessage(chatId,
        'Welcome to <b>Loop Planner</b>!' +
        '\nI can add several same events to your calendar📅' +
        `\nType ${Commands.SETTINGS} to save some preferences`,
        {
          parse_mode: 'HTML',
        },
      );
    case Commands.NEW_SHIFTS:
      const currentWeekStart = datefns.startOfWeek(
        new Date(), { weekStartsOn: 1 });
      const nextWeekStart = datefns.addWeeks(currentWeekStart, 1);
      const [currentWeekEnd, nextWeekEnd] = [
        datefns.addDays(currentWeekStart, 6),
        datefns.addDays(nextWeekStart, 6),
      ];
      return bot.sendMessage(
        chatId,
        `Would you like to add shifts to current week` +
        `<b> [${dateToShortMsg(currentWeekStart)} - ` +
        `${dateToShortMsg(currentWeekEnd)}]</b> ` +
        `or the next <b>[${dateToShortMsg(nextWeekStart)} - ` +
        `${dateToShortMsg(nextWeekEnd)}]</b>? ` +
        `Also, you can add shift to any other date`,
        {
          parse_mode: 'HTML',
          reply_markup: JSON.stringify({
            inline_keyboard: InlineKeyboards.peekWeek,
          }),
        });
    case Commands.REMOVE_SHIFTS:
      return bot.sendMessage(chatId, 'Remove shifts');
    case Commands.EDIT_SHIFT:
      return bot.sendMessage(chatId, 'Edit shift');
    case Commands.SHOW_SHIFTS:
      return bot.sendMessage(chatId,
        'Shifts from which interval would you like to see?',
        {
          parse_mode: 'HTML',
          reply_markup: JSON.stringify({
            inline_keyboard: InlineKeyboards.showShifts,
          }),
        });
    case Commands.SETTINGS:
      CURRENT_USER = await User.findOne({ userID });
      if (!CURRENT_USER) {
        CURRENT_USER = await User.create({ userID });
      }
      settings = new Settings({
        eventName: CURRENT_USER.eventName,
        duration: CURRENT_USER.duration,
        firstShiftStart: CURRENT_USER.firstShiftStart,
        secondShiftStart: CURRENT_USER.secondShiftStart,
        wage: CURRENT_USER.wage,
        calendarID: CURRENT_USER.calendarID,
      });
      CHAT_ID = chatId;
      return bot.sendMessage(chatId,
        `Here's your preferences:\n${settings.toString()}`,
        {
          parse_mode: 'HTML',
          reply_markup: JSON.stringify({
            inline_keyboard: InlineKeyboards.settings(),
          }),
        });
    default:
      if (NEW_EVENT_NAME_INPUT) {
        settings.update({ eventName: msgTxt });
        NEW_EVENT_NAME_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      if (NEW_EVENT_DURATION_INPUT) {
        settings.update({ duration: Time.parse(msgTxt) });
        NEW_EVENT_DURATION_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      if (FIRST_SHIFT_START_INPUT) {
        const newTime = Time.parse(msgTxt);
        settings.update({ firstShiftStart: newTime });
        FIRST_SHIFT_START_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      if (SECOND_SHIFT_START_INPUT) {
        const newTime = Time.parse(msgTxt);
        settings.update({ secondShiftStart: newTime });
        SECOND_SHIFT_START_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      if (NEW_WAGE_INPUT) {
        settings.update({ wage: parseFloat(msgTxt) });
        NEW_WAGE_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      if (NEW_CALENDAR_ID_INPUT) {
        settings.update({ calendarID: msgTxt });
        NEW_CALENDAR_ID_INPUT = false;
        return bot.editMessageText(
          `Here's your preferences:\n${settings.toString()}`,
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.settings(),
            }),
          });
      }
      return bot.sendMessage(chatId, 'Invalid command, try again👀');
  }
});

bot.on('callback_query', async (msg) => {
  const [data, userID, chatId, msgId, msgText, keyboard] = [
    msg.data,
    msg.from.id,
    msg.message.chat.id,
    msg.message.message_id,
    msg.message.text,
    msg.message.reply_markup.inline_keyboard,
  ];
  try {
    switch (data) {
      case Constants.CURRENT_WEEK:
        const currentWeekStart = datefns.startOfWeek(
          new Date(), { weekStartsOn: 1 });
        return bot.sendMessage(chatId,
          `Provide the dates you would like to work ` +
          `<b>[${dateToShortMsg(currentWeekStart)} - ` +
          `${dateToShortMsg(datefns.addDays(currentWeekStart, 6))}]</b>:`, {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.printWeek(currentWeekStart),
            }),
          });
      case Constants.NEXT_WEEK:
        const nextWeekStart = datefns.addDays(
          datefns.startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
        return bot.sendMessage(chatId,
          `Provide the dates you would like to work ` +
          `<b>[${dateToShortMsg(nextWeekStart)} - ` +
          `${dateToShortMsg(datefns.addDays(nextWeekStart, 6))}]</b>:`, {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.printWeek(nextWeekStart),
            }),
          });
      case Constants.RESET_DAYS:
        return bot.editMessageReplyMarkup({
          inline_keyboard: InlineKeyboards.resetDays(
            keyboard),
        },
        {
          chat_id: chatId,
          message_id: msgId,
        },
        );
      case Constants.SUBMIT_DAYS:
        const dates = getDaysFromKeyboard(
          keyboard);
        return bot.sendMessage(chatId,
          `Provide shifts for each day:`,
          {
            reply_markup: JSON.stringify({
              resize_keyboard: true,
              inline_keyboard: InlineKeyboards.peekTime(dates),
            }),
          });
      case Constants.SUBMIT_TIME:
        if (checkAllDaysPicked(keyboard)) {
          CURRENT_USER = await User.findOne({ userID });
          const dateTimeList = generateList(keyboard, CURRENT_USER);
          dateTimeList.forEach(async (dateTime) => {
            let [startDateTime, endDateTime] = genShiftPair(dateTime);
            startDateTime =
              datefns.parse(startDateTime, 'dLLL HH:mm', new Date());
            endDateTime =
              datefns.parse(endDateTime, 'dLLL HH:mm', new Date());
            const event = {
              'summary': CURRENT_USER.eventName,
              'start': {
                'dateTime': startDateTime,
                'timeZone': 'Europe/London',
              },
              'end': {
                'dateTime': endDateTime,
                'timeZone': 'Europe/London',
              },
            };
            const res = await calendar.events.insert({
              auth,
              calendarId: CURRENT_USER.calendarID,
              resource: event,
            });
            const formattedDate = datefns.format(startDateTime, 'dd/LL/yyyy');
            if (res.status === 200) {
              await bot.sendMessage(chatId,
                `✅Event on ${formattedDate} created successfully`);
            } else {
              await bot.sendMessage(chatId,
                `🚫Event on ${formattedDate} ` +
                  `creation failed: Status ${res.status} :(`);
            }
          });
        } else {
          return bot.sendMessage(chatId, 'Peek shifts for each day');
        }
        await bot.sendMessage(chatId, 'Finished🥳');
        break;
      case Constants.CHANGE_EVENT_NAME:
        NEW_EVENT_NAME_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId, 'Type new event name');
      case Constants.CHANGE_EVENT_DURATION:
        NEW_EVENT_DURATION_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId, 'Type new event duration');
      case Constants.CHANGE_FIRST_SHIFT_START:
        FIRST_SHIFT_START_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type new time when the first shift starts');
      case Constants.CHANGE_SECOND_SHIFT_START:
        SECOND_SHIFT_START_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type new time when the second shift starts');
      case Constants.CHANGE_WAGE:
        NEW_WAGE_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type the new wage');
      case Constants.CHANGE_CALENDAR_ID:
        NEW_CALENDAR_ID_INPUT = true;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type your calendar ID');
      case Constants.SUBMIT_SETTINGS:
        CURRENT_USER = await User.findOne({ userID });
        CURRENT_USER.eventName = settings.preferences.eventName;
        CURRENT_USER.duration = settings.preferences.duration.toString();
        CURRENT_USER.firstShiftStart =
          settings.preferences.firstShiftStart.toString();
        CURRENT_USER.secondShiftStart =
          settings.preferences.secondShiftStart.toString();
        CURRENT_USER.wage = settings.preferences.wage;
        CURRENT_USER.calendarID = settings.preferences.calendarID;
        await CURRENT_USER.save();
        await bot.editMessageReplyMarkup({},
          {
            chat_id: CHAT_ID,
            message_id: MESSAGE_ID,
          });
        return bot.sendMessage(chatId, 'Settings updated successfully✅');
      case Constants.THIS_MONTH_SHIFTS:
        CURRENT_USER = await User.findOne({ userID });
        const currentDate = new Date();
        const [startOfMonth, endOfMonth] = [
          datefns.startOfMonth(currentDate),
          datefns.endOfMonth(currentDate),
        ];
        const response = await calendar.events.list({
          auth,
          calendarId: CURRENT_USER.calendarID,
          timeMin: startOfMonth,
          timeMax: endOfMonth,
          timeZone: 'Europe/London',
        });
        if (response.length === 0) {
          return bot.sendMessage(chatId,
            'No events in this period😕');
        }
        const listOfEvents =
          createEventsList(response.data.items, CURRENT_USER.eventName);
        let responseText = listOfEvents.map((event) => {
          if (!event.isEvent) {
            return `<i>${event.data}</i>`;
          }
          const [startDateTime, finishDateTime] = [
            event.data.start.dateTime,
            event.data.end.dateTime,
          ];
          return `<b>${datefns
            .format(startDateTime, 'dd/LL/yyyy')}</b>: ` +
              `${datefns.format(startDateTime, 'HH:mm')} - ` +
              `${datefns.format(finishDateTime, 'HH:mm')}`;
        });
        responseText = ['The list of shifts in calendar:', ...responseText];
        responseText = responseText.join('\n');
        return bot.sendMessage(chatId, responseText, {
          parse_mode: 'HTML',
        });
      default:
        if (data.includes('EVENT_DATE')) {
          const dateToTick = data.split(':')[1];
          return bot.editMessageReplyMarkup({
            inline_keyboard: InlineKeyboards.tickDay(
              keyboard, dateToTick),
          },
          {
            chat_id: chatId,
            message_id: msgId,
          });
        }
        if (data.includes('TIME_NOT_PICKED')) {
          const dateToChange = data.split(':')[1];
          return bot.editMessageReplyMarkup({
            inline_keyboard: InlineKeyboards.changeShift(
              keyboard, dateToChange),
          },
          {
            chat_id: chatId,
            message_id: msgId,
          });
        }
        return bot.sendMessage(chatId, 'Invalid command, try again👀');
    }
  } catch (e) {
    return bot.sendMessage(chatId, `Error occurred! ${e.message}`);
  }
});
