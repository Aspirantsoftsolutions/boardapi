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
    firstName: {
      type: String,
      required: false
    },
    lastName: {
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
      required: false
    },
    grade: {
      type: String,
      required: false
    },
    itemail: {
      type: String,
      required: false
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
      required: true
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
      required: true,
      default: 1
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
    },
    teacherId: {
      type: String
    },
    isGoogleDriveEnable: {
      type: Boolean,
      default: false
    },
    isOneDriveEnable: {
      type: Boolean,
      default: false
    },
    isImmersiveReaderEnable: {
      type: Boolean,
      default: false
    },
    isMagicDrawEnable: {
      type: Boolean,
      default: false
    },
    isHandWritingEnable: {
      type: Boolean,
      default: false
    },
    isPhetEnable: {
      type: Boolean,
      default: false
    },
    isGeoGebraEnable: {
      type: Boolean,
      default: true
    },
    isCreativeToolsEnable: {
      type: Boolean,
      default: true
    },
    isNewPageEnable: {
      type: Boolean,
      default: true
    },
    isBackgroundEnable: {
      type: Boolean,
      default: true
    },
    isSaveSBEnable: {
      type: Boolean,
      default: true
    },
    isImportEnable: {
      type: Boolean,
      default: true
    },
    isScreenshotEnable: {
      type: Boolean,
      default: false
    },
    isRecordingEnable: {
      type: Boolean,
      default: false
    },
    isQRCodeEnable: {
      type: Boolean,
      default: false
    },
    isParticipateModeEnable: {
      type: Boolean,
      default: false
    },
    isExportpdfEnable: {
      type: Boolean,
      default: false
    },
    isSessionInteractionEnable: {
      type: Boolean,
      default: false
    },
    isStudentAttendanceEnable: {
      type: Boolean,
      default: false
    },
    isSSOIntegrationEnable: {
      type: Boolean,
      default: false
    },
    schoolId: {
      type: String
    },
    isDeviceManagementEnable: {
      type: Boolean,
      default: false
    },
    isQRloginEnable: {
      type: Boolean,
      default: false
    },
    licenseStartDate: {
      type: Date,
      required: true
    },
    licenseEndDate: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

// UserSchema.index({ mobile: 1, countryCode: 1 }, { unique: true });
UserSchema.pre("save", function (next) {
  const user = this;
  let referEnd = ""

  if (user.email) {
    referEnd = user.email.substr(9)
  } else {
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