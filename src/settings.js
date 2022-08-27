export default class Settings {
  preferences = {
    eventName: undefined,
    duration: undefined,
    firstShiftStart: undefined,
    secondShiftStart: undefined,
  };
  constructor(props = {}) {
    this.preferences = { ...this.preferences, ...props };
  }
  update(props) {
    this.preferences = { ...this.preferences, ...props };
  }
  toString() {
    const result = [];
    result.push(`📝Event name: ${this.preferences.eventName || '[...]'};`);
    result.push(`⏰Event duration: ${this.preferences.duration || '[...]'};`);
    result.push(
      `🕒First shift start: ${this.preferences.firstShiftStart?.toString() ||
        '[...]'};`);
    result.push(
      `🕤Second shift start: ${this.preferences.secondShiftStart?.toString() ||
        '[...]'};`);
    return result.join('\n');
  }
}
