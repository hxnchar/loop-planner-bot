import TelegramApi from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import datefns from 'date-fns';
import { dateToMsg } from './helpers.js';
import InlineKeyboards from './inline-keyboards.js';
import Commands from './commands.js';

dotenv.config();

const bot = new TelegramApi(process.env.BOT_TOKEN, {polling: true});

bot.setMyCommands([
  { command: Commands.start, description: 'Initial command' },
  { command: Commands.newShifts, description: 'Add new shifts to your schedule' },
  { command: Commands.removeShifts, description: 'Removes shift from your schedule' },
  { command: Commands.editShift, description: 'Edit your shifts' },
  { command: Commands.showShifts, description: 'Shows the full list of your shifts' },
]);

bot.on('message', async (msg) => {
  const [msgTxt, chatId] = [msg.text, msg.chat.id];
  switch (msgTxt) {
    case Commands.start:
      return bot.sendMessage(chatId,
          'Welcome to <b>Loop Planner</b>!\nI can add several same events to your calendar📅',
          {parse_mode : "HTML"}
      );
      break;
    case Commands.newShifts:
      const currentWeekStart = datefns.startOfWeek(new Date(), {weekStartsOn: 1});
      const nextWeekStart = datefns.addDays(currentWeekStart, 7);
      const [currentWeekEnd, nextWeekEnd] = [datefns.addDays(currentWeekStart, 6), datefns.addDays(nextWeekStart, 6)];
      return bot.sendMessage(
          chatId,
          `Would you like to add shifts to current week <b>[${dateToMsg(currentWeekStart)} - ${dateToMsg(currentWeekEnd)}]</b> or the next <b>[${dateToMsg(nextWeekStart)} - ${dateToMsg(nextWeekEnd)}]</b>? Also, you can add shift to any other date`,
          {
            parse_mode : "HTML",
            reply_markup: {
              inline_keyboard: InlineKeyboards.peekWeek
            }
          });
    case Commands.removeShifts:
      return bot.sendMessage(chatId, 'Remove shifts');
    case Commands.editShift:
      return bot.sendMessage(chatId, 'Edit shift');
    case Commands.showShifts:
      return bot.sendMessage(chatId, 'Show shifts');
    default:
      return bot.sendMessage(chatId, 'Invalid command, try again👀');
  }
});
