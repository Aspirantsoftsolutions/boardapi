import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';


function makeid() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 3; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

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
    teacherId: {
      type: Array
    },
    shortId: {
      type: String,
      default: makeid
    }
  },
  { timestamps: true }
);

ClassSchema.pre("save", function (next) {
  const user = this;

  next();
});
export default mongoose.model("Class", ClassSchema);