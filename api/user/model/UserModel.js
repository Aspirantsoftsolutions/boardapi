import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

var UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true
    },
    fullName: {
      type: String,
      required: false
    },
    mobile: {
      type: String,
      required: false,
      trim: true
    },
    countryCode: {
      type: String,
      required: false,
      trim: true
    },
    classId: {
      type: String,
      required:false
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      unique: true
    },
    location: {
      type: String,
      required: false,
    },
    organisation: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    profile_pic: {
      type: String,
      default: ""
    },
    bio: {
      type: String
    },
    dob: {
      type: Date
    },
    language: {
      type: String
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    zip_code: {
      type: String
    },
    gender: {
      type: String
    },
    referral_code: {
      type: String
    },
    isConfirmed: {
      type: Boolean,
      required: false,
      default: 0
    },
    confirmOTP: {
      type: String,
      required: false
    },
    user_name_changes: {
      type: Number,
      default: 0
    },
    username_changed_date: {
      type: Date,
      required: false
    },
    lastLogin: {
      type: Date,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    postCount: {
      type: Number,
      default: 0
    },
    followersCount: {
      type: Number,
      default: 0
    },
    followingsCount: {
      type: Number,
      default: 0
    },
    external_url: {
      type: String
    },
     className: {
      type: String
    }
  },
  { timestamps: true }
);

// UserSchema.index({ mobile: 1, countryCode: 1 }, { unique: true });
UserSchema.pre("save", function (next) {
  const user = this;
  let referEnd = ""
  
  if(user.email){
    referEnd = user.email.substr(9)
  }else{
    referEnd = user.mobile.substr(9);
  }
  if (!user.referral_code) {
    user.referral_code =
      "StreamBoard" +
      Math.random().toString(36).substring(2, 5).toUpperCase() + referEnd
      
  }
  next();
});

export default mongoose.model("User", UserSchema);