export class Shift {
  date;
  timeStart;
  timeEnd;
  constructor(date, timeStart, timeEnd) {
    this.date = date;
    this.timeStart = timeStart;
    this.timeEnd = timeEnd;
  }
  toString() {
    return (
      `${this.date}: ${this.timeStart.toString()} - ${this.timeEnd.toString()}`
    );
  }
}
