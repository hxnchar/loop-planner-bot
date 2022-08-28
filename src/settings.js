export default class Settings {
  preferences = {
    eventName: undefined,
    duration: undefined,
    firstShiftStart: undefined,
    secondShiftStart: undefined,
    wage: undefined,
  };
  constructor(props = {}) {
    this.preferences = { ...this.preferences, ...props };
  }
  update(props) {
    this.preferences = { ...this.preferences, ...props };
  }
  toString() {
    const result = [];
    result.push(`📝Event name: <i>${this.preferences.eventName ||
      '[...]'}</i>;`);
    result.push(
      `⏰Event duration: <i>${this.preferences.duration?.toString() ||
        '[...]'}</i>;`);
    result.push(
      `🕒First shift start: <i>${this.preferences.firstShiftStart?.toString() ||
        '[...]'}</i>;`);
    result.push(
      `🕤Second shift start: ` +
        `<i>${this.preferences.secondShiftStart?.toString() ||
          '[...]'}</i>;`);
    result.push(`💷Wage: <i>${this.preferences.wage || '[...]'}</i>.`);
    return result.join('\n');
  }
}
