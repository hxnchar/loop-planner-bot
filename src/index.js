import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import datefns from 'date-fns';
import {
  checkAllDaysPicked,
  dateToShortMsg, generateList,
  getDaysFromKeyboard,
  genShiftPair,
  showShifts,
} from './services/helpers.js';
import InlineKeyboards from './bot-helpers/inline-keyboards.js';
import { calendar, auth } from './api/calendar.js';
import Commands from './bot-helpers/commands.js';
import Constants from './bot-helpers/constants.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import Settings from './libs/settings.js';
import Time from './libs/time.js';
dotenv.config();

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
  const currentDate = new Date();
  const currentWeekStart =
    datefns.startOfWeek(currentDate, { weekStartsOn: 1 });
  const nextWeekStart = datefns.addDays(currentWeekStart, 7);
  const [currentWeekEnd, nextWeekEnd] = [
    datefns.addDays(currentWeekStart, 6),
    datefns.addDays(nextWeekStart, 6),
  ];
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
  const [data, userID, chatId, msgId, keyboard] = [
    msg.data,
    msg.from.id,
    msg.message.chat.id,
    msg.message.message_id,
    msg.message.reply_markup.inline_keyboard,
  ];
  const currentDate = new Date();
  const currentWeekStart =
    datefns.startOfWeek(currentDate, { weekStartsOn: 1 });
  const nextWeekStart = datefns.addDays(currentWeekStart, 7);
  let startDate, endDate;
  let datesForEvents, dateTimeList;
  let event, response, formatted;
  try {
    switch (data) {
      case Constants.CURRENT_WEEK:
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
        datesForEvents = getDaysFromKeyboard(
          keyboard);
        return bot.sendMessage(chatId,
          `Provide shifts for each day:`,
          {
            reply_markup: JSON.stringify({
              resize_keyboard: true,
              inline_keyboard: InlineKeyboards.peekTime(datesForEvents),
            }),
          });
      case Constants.SUBMIT_TIME:
        if (checkAllDaysPicked(keyboard)) {
          CURRENT_USER = await User.findOne({ userID });
          dateTimeList = generateList(keyboard, CURRENT_USER);
          dateTimeList.forEach(async (dateTime) => {
            [startDate, endDate] = genShiftPair(dateTime);
            startDate =
              datefns.parse(startDate, 'dLLL HH:mm', new Date());
            endDate =
              datefns.parse(endDate, 'dLLL HH:mm', new Date());
            event = {
              'summary': CURRENT_USER.eventName,
              'start': {
                'dateTime': startDate,
                'timeZone': 'Europe/London',
              },
              'end': {
                'dateTime': endDate,
                'timeZone': 'Europe/London',
              },
            };
            response = await calendar.events.insert({
              auth,
              calendarId: CURRENT_USER.calendarID,
              resource: event,
            });
            formatted = datefns.format(startDate, 'dd/LL/yyyy');
            if (response.status === 200) {
              await bot.sendMessage(chatId,
                `✅Event on ${formatted} created successfully`);
            } else {
              await bot.sendMessage(chatId,
                `🚫Event on ${formatted} ` +
                  `creation failed: Status ${response.status} :(`);
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
        [startDate, endDate] = [
          datefns.startOfMonth(currentDate),
          datefns.endOfMonth(currentDate),
        ];
        showShifts({
          auth,
          calendar,
          bot,
          chatId,
          calendarId: CURRENT_USER.calendarID,
          startDate,
          endDate,
          eventName: CURRENT_USER.eventName,
        });
        break;
      case Constants.CURRENT_AND_PREVIOUS:
        CURRENT_USER = await User.findOne({ userID });
        [startDate, endDate] = [
          datefns.subMonths(datefns.startOfMonth(currentDate), 1),
          datefns.endOfMonth(currentDate),
        ];
        showShifts({
          auth,
          calendar,
          bot,
          chatId,
          calendarId: CURRENT_USER.calendarID,
          startDate,
          endDate,
          eventName: CURRENT_USER.eventName,
        });
        break;
      case Constants.ALL_SHIFTS_LIST:
        CURRENT_USER = await User.findOne({ userID });
        [startDate, endDate] = [
          datefns.subYears(currentDate, 5),
          datefns.addYears(currentDate, 5),
        ];
        showShifts({
          auth,
          calendar,
          bot,
          chatId,
          calendarId: CURRENT_USER.calendarID,
          startDate,
          endDate,
          eventName: CURRENT_USER.eventName,
        });
        break;
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
  return bot.sendMessage(chatId, `It is no way to get this message`);
});
