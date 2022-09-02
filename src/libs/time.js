export default class Time {
  hours;
  minutes;
  nextDay;
  constructor(hours, minutes = 0, nextDay = false) {
    if (hours < 0 || hours > 24) {
      throw new Error('Hours must be between 0 and 24');
    }
    if (minutes < 0 || minutes > 60) {
      throw new Error('Minutes must be between 0 and 24');
    }
    this.hours = hours;
    this.minutes = minutes;
    this.nextDay = nextDay;
  }
  static parse(str) {
    str = str?.trim();
    let time = null;
    const splittersArr = [':', '.', '/', ' '];
    splittersArr.forEach((char) => {
      if (str.includes(char)) {
        const splitted = str.split(char);
        const [hours, minutes] = [Number(splitted[0]), Number(splitted[1])];
        time = new Time(hours, minutes);
      }
    });
    if (!time) {
      try {
        const hours = Number(str);
        if (hours) {
          time = new Time(hours);
        }
      } catch (e) {
        return null;
      }
    }
    return time;
  }
  static formatNum(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }
  add(time) {
    let newHours = this.hours + time.hours;
    let newMinutes = this.minutes + time.minutes;
    if (newMinutes > 60) {
      newMinutes -= 60;
      newHours += 1;
    }
    if (newHours >= 24) {
      newHours -= 24;
      this.nextDay = true;
    }
    return new Time(newHours, newMinutes, this.nextDay);
  }
  toString() {
    return `${Time.formatNum(this.hours)}:${Time.formatNum(this.minutes)}`;
  }
}
