import Constants from './constants.js';
import datefns from "date-fns";
import {dateToLongMsg} from "./helpers.js";

export default class InlineKeyboards {
  static peekWeek = [
    [{text: 'current', callback_data: Constants.CURRENT_WEEK}],
    [{text: 'next', callback_data: Constants.NEXT_WEEK}],
    [{text: 'custom', callback_data: Constants.CUSTOM_DATE}],
  ];
  static printWeek(firstDate) {
    const res = [];
    for (let i = 0; i <= 2; i++) {
      const tempArr = [];
      for (let j = 0; j <= 2; j++) {
        tempArr.push({text: dateToLongMsg(firstDate), callback_data: firstDate});
        firstDate = datefns.addDays(new Date(firstDate), 1);
        if (res.length === 2) break;
      };
      res.push(tempArr);
    };
    res.at(res.length - 1).splice(0, 0, {text: '🔄', callback_data: Constants.RESET_DAYS});
    res.at(res.length - 1).push({text: '▶️', callback_data: Constants.SUBMIT_DAYS})
    return res;
  };
}

