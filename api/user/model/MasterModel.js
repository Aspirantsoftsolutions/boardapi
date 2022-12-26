import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

var MasterSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    role: {
      type: String,
      required: true
    },
    locale: {
      type: String,
      default: 'en'
    }
  },
  { timestamps: true }
);

MasterSchema.pre("save", function (next) {
  const user = this;

  next();
});
export default mongoose.model("MasterData", MasterSchema);