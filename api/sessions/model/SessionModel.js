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

    ref: 'Student'
  },
  writeAccess: { type: Boolean, default: false },
  huddle: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: ''
  },
  loggedIn: { type: Boolean, default: false },
  username: {
    type: String,
    default: ''
  },
  useractivestatus: {
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
    currentSessionId: { type: String, default: '' },
    writeSessionId: {
      type: String,
      required: true,
      default: makeid,
      unique: true
    },
    bgImage: { type: String, default: '' },
    bgColor: { type: String, default: '' },
    huddlemode: { type: Boolean, default: false },
    title: {
      type: String
    },
    type: {
      type: String,
      required: true,
    },
    start: {
      type: String
    },
    end: {
      type: String
    },
    status: {
      type: String
    },
    sessionLink: {
      type: String,
      required: false
    },
    description: {
      type: String
    },
    groupId: {
      type: String,
      ref: 'groups'
    },
    teacherId: {
      type: String
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
    },
    creationType: {
      type: String,
      required: true,
      enum: ['normal', 'adhoc'],
      default: 'normal'
    }
  },
  { timestamps: true }
);
export default mongoose.model("Sessions", SessionSchema);