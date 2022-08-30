import mongoose from 'mongoose';

const User = new mongoose.Schema({
  userID: { type: Number, unique: true, required: true },
  eventName: { type: String },
  duration: { type: String },
  firstShiftStart: { type: String },
  secondShiftStart: { type: String },
  wage: { type: Number },
  calendarID: { type: String },
});

export default mongoose.model('User', User);
