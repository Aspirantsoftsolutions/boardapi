import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

var SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true
    },
     description: {
       type: String,
       required: false,
    },
      groupId: {
        type: String,
        required: false,
    },
       teacherId: {
         type: String,
         required: false,
       },
  },
  { timestamps: true }
);

// SessionSchema.index({ mobile: 1, countryCode: 1 }, { unique: true });
SessionSchema.pre("save", function (next) {

  next();
});

export default mongoose.model("Sessions", SessionSchema);