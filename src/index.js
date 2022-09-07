import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import {
  format, parse,
  startOfWeek, addDays,
  addYears, subYears,
  startOfMonth, endOfMonth, subMonths,
} from 'date-fns';
import {
  checkAllDaysPicked,
  generateList,
  getDaysFromKeyboard,
  genShiftPair,
} from './services/helpers.js';
import InlineKeyboards from './bot-helpers/inline-keyboards.js';
import {
  getEventId, removeEvent, insertEvent, showShifts, monthlyPayment,
} from './api/calendar.js';
import Commands from './bot-helpers/commands.js';
import Formats from './bot-helpers/formats.js';
import Constants from './bot-helpers/constants.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import Settings from './libs/settings.js';
import Time from './libs/time.js';
dotenv.config();

const userAction = {
  action: undefined,
  date: undefined,
};

let CHAT_ID;
let MESSAGE_ID;
let settings = new Settings();
let settingsChanged = false;
let curUser;
let deleteEvent;
let actionDate;

await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.echufqm.mongodb.net/?retryWrites=true&w=majority`,
  () => {
    console.log('DB connected succsessfully');
  },
  (e) => console.log(e));
const bot = new TelegramApi(process.env.BOT_TOKEN, { polling: true });

await bot.setMyCommands(Commands.list);

bot.on('message', async (msg) => {
  const [msgTxt, chatId, userId] = [msg.text, msg.chat.id, msg.from.id];
  curUser = await User.findOne({ userId });
  const curDate = new Date();
  const curWeekStart =
    startOfWeek(curDate, { weekStartsOn: 1 });
  const nextWeekStart = addDays(curWeekStart, 7);
  const [curWeekEnd, nextWeekEnd] = [
    addDays(curWeekStart, 6),
    addDays(nextWeekStart, 6),
  ];
  const [curMonthStart, curMonthEnd] = [
    startOfMonth(curDate),
    endOfMonth(curDate),
  ];
  let response, eventId;
  try {
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
          `<b> [${format(curWeekStart, Formats.dateMonth)} - ` +
          `${format(curWeekEnd, Formats.dateMonth)}]</b> ` +
          `or the next <b>[${format(nextWeekStart, Formats.dateMonth)} - ` +
          `${format(nextWeekEnd, Formats.dateMonth)}]</b>?`,
          {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.peekWeek,
            }),
          });
      case Commands.REMOVE_SHIFTS:
        deleteEvent = true;
        return bot.sendMessage(chatId,
          'What date do you need to remove the shift?');
      case Commands.SHOW_SHIFTS:
        return bot.sendMessage(chatId,
          'Shifts from which interval would you like to see?',
          {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.showShifts,
            }),
          });
      case Commands.CALCULATE_PAYMENT:
        response = await monthlyPayment(curUser.calendarID, curUser.wage, {
          eventName: curUser.eventName,
          startDate: curMonthStart,
          endDate: curMonthEnd,
        });
        return bot.sendMessage(chatId,
          `Your salary in this month going to be\n` +
            `<b>£${response * 100 / 100}</b> without tax\n` +
            `<b>£${(response * .8) * 100 / 100}</b> tax included`,
          {
            parse_mode: 'HTML',
          });
      case Commands.SETTINGS:
        if (!curUser) {
          curUser = await User.create({ userId });
        }
        settings = new Settings({
          eventName: curUser.eventName,
          duration: curUser.duration,
          firstShiftStart: curUser.firstShiftStart,
          secondShiftStart: curUser.secondShiftStart,
          wage: curUser.wage,
          calendarID: curUser.calendarID,
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
        switch (userAction.action) {
          case Constants.CHANGE_EVENT_NAME:
            settingsChanged = settings.update({ eventName: msgTxt });
            userAction.action = null;
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
          case Constants.CHANGE_EVENT_DURATION:
            settingsChanged = settings.update({ duration: Time.parse(msgTxt) });
            userAction.action = null;
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
          case Constants.CHANGE_FIRST_SHIFT_START:
            settingsChanged = settings.update({ duration: Time.parse(msgTxt) });
            userAction.action = null;
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
          case Constants.CHANGE_SECOND_SHIFT_START:
            settingsChanged =
              settings.update({ secondShiftStart: Time.parse(msgTxt) });
            userAction.action = null;
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
          case Constants.CHANGE_WAGE:
            settingsChanged = settings.update({ wage: parseFloat(msgTxt) });
            userAction.action = null;
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
          case Constants.CHANGE_CALENDAR_ID:
            settingsChanged = settings.update({ calendarID: msgTxt });
            userAction.action = null;
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
        if (deleteEvent) {
          actionDate = parse(msgTxt, Formats.fullDateShort, new Date());
          if (actionDate.toString() === 'Invalid Date') {
            actionDate = null;
            return bot.sendMessage(chatId,
              `Provide date in the following format: ` +
                `<i>${format(curDate, Formats.fullDateShort)}</i>`,
              {
                parse_mode: 'HTML',
              });
          }
          eventId = await getEventId(
            curUser.calendarID,
            curUser.eventName,
            actionDate);
          response = await removeEvent(curUser.calendarID, eventId);
          actionDate = null;
          if (response) {
            return bot.sendMessage(chatId, 'Event removed succesfully');
          }
          return bot.sendMessage(chatId, 'Something went wrong');
        }
        return bot.sendMessage(chatId, 'Invalid command, try again👀');
    }
  } catch (e) {
    return bot.sendMessage(chatId, `Error occurred! ${e.message}`);
  }
});

bot.on('callback_query', async (msg) => {
  const [data, userId, chatId, msgId, keyboard] = [
    msg.data,
    msg.from.id,
    msg.message.chat.id,
    msg.message.message_id,
    msg.message.reply_markup.inline_keyboard,
  ];
  curUser = await User.findOne({ userId });
  const curDate = new Date();
  const curWeekStart =
    startOfWeek(curDate, { weekStartsOn: 1 });
  const nextWeekStart = addDays(curWeekStart, 7);
  const [curWeekEnd, nextWeekEnd] = [
    addDays(curWeekStart, 6),
    addDays(nextWeekStart, 6),
  ];
  let startDate, endDate;
  let datesForEvents, dateTimeList;
  let response, formatted;
  try {
    switch (data) {
      case Constants.CURRENT_WEEK:
        return bot.sendMessage(chatId,
          `Provide the dates you would like to work ` +
          `<b>[${format(curWeekStart, Formats.dateMonth)} - ` +
          `${format(curWeekEnd, Formats.dateMonth)}]</b>:`, {
            parse_mode: 'HTML',
            reply_markup: JSON.stringify({
              inline_keyboard: InlineKeyboards.printWeek(curWeekStart),
            }),
          });
      case Constants.NEXT_WEEK:
        return bot.sendMessage(chatId,
          `Provide the dates you would like to work ` +
          `<b>[${format(nextWeekStart, Formats.dateMonth)} - ` +
          `${format(nextWeekEnd, Formats.dateMonth)}]</b>:`, {
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
          dateTimeList = generateList(keyboard, curUser);
          dateTimeList.forEach(async (dateTime) => {
            [startDate, endDate] = genShiftPair(dateTime);
            startDate =
              parse(startDate,
                `${Formats.dateMonth} ${Formats.time}`, new Date());
            endDate =
              parse(endDate,
                `${Formats.dateMonth} ${Formats.time}`, new Date());
            response = await insertEvent(curUser.calendarID, {
              eventName: curUser.eventName,
              startDate,
              endDate,
            });
            formatted = format(startDate, Formats.fullDateLong);
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
        return bot.sendMessage(chatId, 'Finished🥳');
      case Constants.CHANGE_EVENT_NAME:
        userAction.action = Constants.CHANGE_EVENT_NAME;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId, 'Type new event name');
      case Constants.CHANGE_EVENT_DURATION:
        userAction.action = Constants.CHANGE_EVENT_DURATION;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId, 'Type new event duration');
      case Constants.CHANGE_FIRST_SHIFT_START:
        userAction.action = Constants.CHANGE_FIRST_SHIFT_START;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type new time when the first shift starts');
      case Constants.CHANGE_SECOND_SHIFT_START:
        userAction.action = Constants.CHANGE_SECOND_SHIFT_START;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type new time when the second shift starts');
      case Constants.CHANGE_WAGE:
        userAction.action = Constants.CHANGE_WAGE;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type the new wage');
      case Constants.CHANGE_CALENDAR_ID:
        userAction.action = Constants.CHANGE_CALENDAR_ID;
        MESSAGE_ID = msgId;
        return bot.sendMessage(chatId,
          'Type your calendar ID');
      case Constants.SUBMIT_SETTINGS:
        curUser.eventName = settings.preferences.eventName;
        curUser.duration = settings.preferences.duration.toString();
        curUser.firstShiftStart =
          settings.preferences.firstShiftStart.toString();
        curUser.secondShiftStart =
          settings.preferences.secondShiftStart.toString();
        curUser.wage = settings.preferences.wage;
        curUser.calendarID = settings.preferences.calendarID;
        await curUser.save();
        if (settingsChanged) {
          await bot.editMessageReplyMarkup({},
            {
              chat_id: CHAT_ID,
              message_id: MESSAGE_ID,
            });
          return bot.sendMessage(chatId, 'Settings updated successfully✅')
            .then(settingsChanged = false);
        }
        return bot.sendMessage(chatId, 'You didn\'t change anything😐');
      case Constants.THIS_MONTH_SHIFTS:
        [startDate, endDate] = [
          startOfMonth(curDate),
          endOfMonth(curDate),
        ];
        response = await showShifts(curUser.calendarID, {
          startDate,
          endDate,
          eventName: curUser.eventName,
        });
        return bot.sendMessage(chatId, response, {
          parse_mode: 'HTML',
        });
      case Constants.CURRENT_AND_PREVIOUS:
        [startDate, endDate] = [
          subMonths(startOfMonth(curDate), 1),
          endOfMonth(curDate),
        ];
        response = await showShifts(curUser.calendarID, {
          startDate,
          endDate,
          eventName: curUser.eventName,
        });
        return bot.sendMessage(chatId, response, {
          parse_mode: 'HTML',
        });
      case Constants.ALL_SHIFTS_LIST:
        [startDate, endDate] = [
          subYears(curDate, 5),
          addYears(curDate, 5),
        ];
        response = await showShifts(curUser.calendarID, {
          startDate,
          endDate,
          eventName: curUser.eventName,
        });
        return bot.sendMessage(chatId, response, {
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
