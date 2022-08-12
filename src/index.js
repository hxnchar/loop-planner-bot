import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import datefns from 'date-fns';
import { dateToShortMsg } from './helpers.js';
import InlineKeyboards from './inline-keyboards.js';
import Commands from './commands.js';
import Constants from './constants.js';

dotenv.config();

const bot = new TelegramApi(process.env.BOT_TOKEN, {polling: true});

bot.setMyCommands([
  { command: Commands.START, description: 'Initial command' },
  { command: Commands.NEW_SHIFTS, description: 'Add new shifts to your schedule' },
  { command: Commands.REMOVE_SHIFTS, description: 'Removes shift from your schedule' },
  { command: Commands.EDIT_SHIFT, description: 'Edit your shifts' },
  { command: Commands.SHOW_SHIFTS, description: 'Shows the full list of your shifts' },
]);

bot.on('message', async (msg) => {
  const [msgTxt, chatId] = [msg.text, msg.chat.id];
  switch (msgTxt) {
    case Commands.START:
      return bot.sendMessage(chatId,
          'Welcome to <b>Loop Planner</b>!\nI can add several same events to your calendar📅',
          {parse_mode : "HTML"}
      );
      break;
    case Commands.NEW_SHIFTS:
      const currentWeekStart = datefns.startOfWeek(new Date(), {weekStartsOn: 1});
      const nextWeekStart = datefns.addWeeks(currentWeekStart, 1);
      const [currentWeekEnd, nextWeekEnd] = [datefns.addDays(currentWeekStart, 6), datefns.addDays(nextWeekStart, 6)];
      return bot.sendMessage(
          chatId,
          `Would you like to add shifts to current week <b>[${dateToShortMsg(currentWeekStart)} - ${dateToShortMsg(currentWeekEnd)}]</b> or the next <b>[${dateToShortMsg(nextWeekStart)} - ${dateToShortMsg(nextWeekEnd)}]</b>? Also, you can add shift to any other date`,
          {
            parse_mode : "HTML",
            reply_markup: {
              inline_keyboard: InlineKeyboards.peekWeek
            }
          });
    case Commands.REMOVE_SHIFTS:
      return bot.sendMessage(chatId, 'Remove shifts');
    case Commands.EDIT_SHIFT:
      return bot.sendMessage(chatId, 'Edit shift');
    case Commands.SHOW_SHIFTS:
      return bot.sendMessage(chatId, 'Show shifts');
    default:
      return bot.sendMessage(chatId, 'Invalid command, try again👀');
  }
});

bot.on('callback_query', async (msg) => {
  const data = msg.data;
  const chatId = msg.message.chat.id;
  switch (data){
    case Constants.CURRENT_WEEK:
      const currentWeekStart = datefns.startOfWeek(new Date(), {weekStartsOn: 1});
      return await bot.sendMessage(chatId, `Provide the dates you would like to work from ${dateToShortMsg(currentWeekStart)} to ${dateToShortMsg(datefns.addDays(currentWeekStart, 6))}:`, {
        reply_markup: {
          inline_keyboard: InlineKeyboards.printWeek(currentWeekStart)
        }
      });
    case Constants.NEXT_WEEK:
      const nextWeekStart = datefns.addDays(datefns.startOfWeek(new Date(), {weekStartsOn: 1}), 7);
      return await bot.sendMessage(chatId, `Provide the dates you would like to work from ${dateToShortMsg(nextWeekStart)} to ${dateToShortMsg(datefns.addDays(nextWeekStart, 6))}:`, {
        reply_markup: {
          inline_keyboard: InlineKeyboards.printWeek(nextWeekStart)
        }
      });
  }
});
