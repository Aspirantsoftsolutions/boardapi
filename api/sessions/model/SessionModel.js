import mongoose from "mongoose";



function makeid() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}


const attendee = mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    required: false,
    ref:'Student'
  },
  writeAccess: { type: Boolean, default: false },
  huddle: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: ''
  }
})

var SessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      default: makeid,
      unique: true
    },
    writeSessionId: {
      type: String,
      required: true,
      default: makeid,
      unique: true
    },
    title: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    start: {
      type: String,
      required: false,
    },
    end: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    sessionLink: {
      type: String,
      required: false
    },
    description: {
      type: String,
      required: false,
    },
    groupId: {
      type: String,
      required: false,
      ref: 'groups'
    },
    teacherId: {
      type: String,
      required: false,
    },
    participants: {
      type: String
    },
    attendance: [attendee],
    school_id: {
      type: String,
      required: true
    },
    scheduledBy: {
      type: String,
      required: true,
      enum: ['school', 'teacher'],
      default: 'teacher'
    }
  },
  { timestamps: true }
);
export default mongoose.model("Sessions", SessionSchema);