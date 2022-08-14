import Constants from './constants.js';
import datefns from "date-fns";
import {dateToLongMsg, dateToShortMsg} from "./helpers.js";

export default class InlineKeyboards {
  static peekWeek = [
    [{text: 'current', callback_data: Constants.CURRENT_WEEK}],
    [{text: 'next', callback_data: Constants.NEXT_WEEK}],
    [{text: 'custom', callback_data: Constants.CUSTOM_DATE}],
  ];
  static printWeek(firstDate, dateToTick) {
    let curDay = 0;
    const res = [];
    for (let i = 0; i <= 2; i++) {
      const tempArr = [];
      for (let j = 0; j <= 2; j++) {
        if (curDay === 7) break;
        const formatted = dateToShortMsg(firstDate);
        const newText = `${formatted === dateToTick ? '✅' : ''}${dateToLongMsg(firstDate)}`
        tempArr.push({text: `${newText}`, callback_data: `EVENT_DATE:${dateToLongMsg(firstDate)}`});
        firstDate = datefns.addDays(new Date(firstDate), 1);
        curDay += 1;
      };
      res.push(tempArr);
    };
    res.at(res.length - 1).splice(0, 0, {text: '🔄', callback_data: Constants.RESET_DAYS});
    res.at(res.length - 1).push({text: '▶️', callback_data: Constants.SUBMIT_DAYS})
    return res;
  };
  static tickDay(markup, date){
    const tickedDate = `✅ ${date}`;
    for (let i = 0; i < markup.length; i++) {
      for (let j = 0; j < markup[i].length; j++) {
        if (markup[i][j].text === date){
          markup[i][j].text = tickedDate;
        }
        else if (markup[i][j].text === tickedDate)
          markup[i][j].text = date;
      }
    }
    return markup;
  }
  static resetDays(markup){
    for (let i = 0; i < markup.length; i++) {
      for (let j = 0; j < markup[i].length; j++) {
        if (markup[i][j].text.startsWith('✅')){
          markup[i][j].text = markup[i][j].text.slice(2);
        }
      }
    }
    let a;
    return markup;
  }
}

