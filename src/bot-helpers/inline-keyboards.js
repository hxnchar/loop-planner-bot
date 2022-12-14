import datefns from 'date-fns';
import Constants from './constants.js';
import { dateToLongMsg, dateToShortMsg } from '../services/helpers.js';

export default class InlineKeyboards {
  static peekWeek = [
    [{ 'text': 'current', 'callback_data': Constants.CURRENT_WEEK }],
    [{ 'text': 'next', 'callback_data': Constants.NEXT_WEEK }],
  ];

  static showShifts = [
    [{ 'text': '➡️This month', 'callback_data': Constants.THIS_MONTH_SHIFTS }],
    [
      {
        'text': '🔄Current + previous',
        'callback_data': Constants.CURRENT_AND_PREVIOUS,
      },
    ],
    [{ 'text': '↔️All shifts list', 'callback_data': Constants.ALL_SHIFTS_LIST }],
  ];

  static settings = () => [
    [
      {
        'text': '📝Event name [string]',
        'callback_data': Constants.CHANGE_EVENT_NAME,
      },
    ],
    [
      {
        'text': '⏰Event duration [time]',
        'callback_data': Constants.CHANGE_EVENT_DURATION,
      },
    ],
    [
      {
        'text': '🕒First shift start [time]',
        'callback_data': Constants.CHANGE_FIRST_SHIFT_START,
      },
    ],
    [
      {
        'text': '🕤Second shift start [time]',
        'callback_data': Constants.CHANGE_SECOND_SHIFT_START,
      },
    ],
    [
      {
        'text': '💷Wage [double]',
        'callback_data': Constants.CHANGE_WAGE,
      },
    ],
    [
      {
        'text': '👤Calendar ID [string]',
        'callback_data': Constants.CHANGE_CALENDAR_ID,
      },
    ],
    [
      {
        'text': '✅Submit',
        'callback_data': Constants.SUBMIT_SETTINGS,
      },
    ],
  ];

  static printWeek(firstDate, dateToTick) {
    let curDay = 0;
    const res = [];
    for (let i = 0; i <= 2; i++) {
      const tempArr = [];
      for (let j = 0; j <= 2; j++) {
        if (curDay === 7) break;
        const formatted = dateToShortMsg(firstDate);
        const newText = `${formatted === dateToTick ? '✅' : ''}${dateToLongMsg(
          firstDate,
        )}`;
        tempArr.push({
          'text': `${newText}`,
          'callback_data': `EVENT_DATE:${dateToLongMsg(firstDate)}`,
        });
        firstDate = datefns.addDays(new Date(firstDate), 1);
        curDay += 1;
      }
      res.push(tempArr);
    }
    res
      .at(res.length - 1)
      .splice(0, 0, { 'text': '🔄', 'callback_data': Constants.RESET_DAYS });
    res
      .at(res.length - 1)
      .push({ 'text': '▶️', 'callback_data': Constants.SUBMIT_DAYS });
    return res;
  }

  static tickDay(markup, date) {
    const tickedDate = `✅ ${date}`;
    for (let i = 0; i < markup.length; i++) {
      for (let j = 0; j < markup[i].length; j++) {
        if (markup[i][j].text === date) {
          markup[i][j].text = tickedDate;
        } else if (markup[i][j].text === tickedDate) {
          markup[i][j].text = date;
        }
      }
    }
    return markup;
  }

  static resetDays(markup) {
    for (let i = 0; i < markup.length; i++) {
      for (let j = 0; j < markup[i].length; j++) {
        if (markup[i][j].text.startsWith('✅')) {
          markup[i][j].text = markup[i][j].text.slice(2);
        }
      }
    }
    return markup;
  }

  static peekTime(days) {
    const res = [];
    const daysInRow = 2;
    for (let i = 0; i < days.length; i++) {
      const tempRes = [];
      for (
        let daysInCurrentRow = 0;
        daysInCurrentRow < daysInRow;
        daysInCurrentRow++
      ) {
        if (!days[i]) {
          break;
        }
        tempRes.push({
          'text': `${days[i]}`,
          'callback_data': `TIME_NOT_PICKED:${days[i]}`,
        });
        i++;
      }
      res.push(tempRes);
    }
    res.push([
      {
        'text': `SUBMIT✅`,
        'callback_data': Constants.SUBMIT_TIME,
      },
    ]);
    return res;
  }

  static changeShift(markup, dateToChange) {
    for (let i = 0; i < markup.length; i++) {
      for (let j = 0; j < markup[i].length; j++) {
        const buttonText = markup[i][j].text;
        if (buttonText.includes(dateToChange) &&
        buttonText.startsWith(Constants.DAY_SYMBOL)) {
          markup[i][j].text =
            `${Constants.NIGHT_SYMBOL}${markup[i][j].text.slice(1)}`;
          return markup;
        }
        if (buttonText.startsWith(Constants.NIGHT_SYMBOL)) {
          markup[i][j].text =
            `${Constants.DAY_SYMBOL}${markup[i][j].text.slice(1)}`;
          return markup;
        }
        markup[i][j].text = `${Constants.DAY_SYMBOL}${markup[i][j].text}`;
        return markup;
      }
    }
    return markup;
  }
}
