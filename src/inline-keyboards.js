import Constants from './constants.js';
import datefns from "date-fns";
import {dateToMsg} from "./helpers.js";

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
        tempArr.push({text: dateToMsg(firstDate), callback_data: firstDate});
        firstDate = datefns.addDays(new Date(firstDate), 1);
        if (res.length === 2) break;
      };
      res.push(tempArr);
    };
    return res;
  };
}

