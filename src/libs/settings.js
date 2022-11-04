import deepEqual from 'deep-equal';
export default class Settings {
  preferences = {
    'eventName': undefined,
    'duration': undefined,
    'firstShiftStart': undefined,
    'secondShiftStart': undefined,
    'wage': undefined,
    'calendarID': undefined,
  };

  constructor(props = {}) {
    this.preferences = { ...this.preferences, ...props };
  }

  update(props) {
    const oldPreferences = this.preferences;
    this.preferences = { ...this.preferences, ...props };
    const newPreferences = this.preferences;
    return !deepEqual(oldPreferences, newPreferences);
  }

  static encodeMail(text) {
    const splitted = text.split('@');
    const base = splitted[0];
    const starsCount = base.length - 2;
    return (
      `${base.charAt(0)}${'*'.repeat(starsCount)}${base.slice(-1)}` +
      `@${splitted[1]}`
    );
  }

  toString() {
    const result = [];
    result.push(
      `📝Event name: <i>${this.preferences.eventName || '[...]'}</i>;`,
    );
    result.push(
      `⏰Event duration: <i>${
        this.preferences.duration?.toString() || '[...]'
      }</i>;`,
    );
    result.push(
      `🕒First shift start: <i>${
        this.preferences.firstShiftStart?.toString() || '[...]'
      }</i>;`,
    );
    result.push(
      `🕤Second shift start: <i>${
        this.preferences.secondShiftStart?.toString() || '[...]'
      }</i>;`,
    );
    result.push(`💷Wage: <i>${this.preferences.wage || '[...]'}</i>;`);
    result.push(
      `👤Calendar ID: <i>${
        this.preferences.calendarID
          ? Settings.encodeMail(this.preferences.calendarID)
          : '[...]'
      }</i>.`,
    );
    return result.join('\n');
  }
}
