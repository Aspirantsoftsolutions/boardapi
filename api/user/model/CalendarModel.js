import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

var CalendarSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    calendar: {
      type: String,
      required: true
    },
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: false
    },
    guests: {
      type: String,
      required: true
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

CalendarSchema.pre("save", function (next) {
  const user = this;

  next();
});
export default mongoose.model("Calendar", CalendarSchema);