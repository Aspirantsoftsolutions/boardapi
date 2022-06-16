import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

var ClassSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true
    },
    className: {
      type: String,
      required: true
    },
    schoolId: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

ClassSchema.pre("save", function (next) {
  const user = this;

  next();
});
export default mongoose.model("Class", ClassSchema);