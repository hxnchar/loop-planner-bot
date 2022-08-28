import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import datefns from 'date-fns';
import {
  checkAllDaysPicked,
  dateToShortMsg, generateList,
  getDaysFromKeyboard,
} from './helpers.js';
import InlineKeyboards from './inline-keyboards.js';
import Commands from './commands.js';
import Constants from './constants.js';
import mongoose from 'mongoose';
import User from './models/User.js';
import Settings from './settings.js';
import Time from './time.js';
dotenv.config();

let NEW_EVENT_NAME_INPUT = false;
let NEW_EVENT_DURATION_INPUT = false;
let FIRST_SHIFT_START_INPUT = false;
let SECOND_SHIFT_START_INPUT = false;
let NEW_WAGE_INPUT = false;
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
        { parse_mode: 'HTML' },
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
            resize_keyboard: true,
            one_time_keyboard: true,
          }),
        });
    case Commands.REMOVE_SHIFTS:
      return bot.sendMessage(chatId, 'Remove shifts');
    case Commands.EDIT_SHIFT:
      return bot.sendMessage(chatId, 'Edit shift');
    case Commands.SHOW_SHIFTS:
      return bot.sendMessage(chatId, 'Show shifts');
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
          `Provide the dates you would like to work` +
          `[${dateToShortMsg(currentWeekStart)} - ` +
          `${dateToShortMsg(datefns.addDays(currentWeekStart, 6))}]:`, {
            reply_markup: JSON.stringify({
              resize_keyboard: true,
              inline_keyboard: InlineKeyboards.printWeek(currentWeekStart),
            }),
          });
      case Constants.NEXT_WEEK:
        const nextWeekStart = datefns.addDays(
          datefns.startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
        return bot.sendMessage(chatId,
          `Provide the dates you would like to work` +
          `[${dateToShortMsg(nextWeekStart)} - ` +
          `${dateToShortMsg(datefns.addDays(nextWeekStart, 6))}]:`, {
            reply_markup: JSON.stringify({
              resize_keyboard: true,
              inline_keyboard: InlineKeyboards.printWeek(nextWeekStart),
            }),
          });
      case Constants.CUSTOM_DATES:
        return bot.sendMessage(chatId, 'Soon👀');
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
          generateList(keyboard);
        } else {
          return bot.sendMessage(chatId, 'Peek shifts for each day');
        }
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
      case Constants.SUBMIT_SETTINGS:
        CURRENT_USER = await User.findOne({ userID });
        console.log(settings.preferences);
        CURRENT_USER.eventName = settings.preferences.eventName;
        CURRENT_USER.duration = settings.preferences.duration.toString();
        CURRENT_USER.firstShiftStart =
          settings.preferences.firstShiftStart.toString();
        CURRENT_USER.secondShiftStart =
          settings.preferences.secondShiftStart.toString();
        CURRENT_USER.wage = settings.preferences.wage;
        await CURRENT_USER.save();
        return bot.sendMessage(chatId, 'Settings updated successfully');
      case Constants.RETURN:
        return bot.sendMessage(chatId, 'Return');
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
  return bot.sendMessage(chatId, 'Soon👀');
});
