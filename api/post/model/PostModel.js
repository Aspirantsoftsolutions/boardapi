import mongoose from "mongoose";

var PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    // media: {
    //   type: [mongoose.Types.ObjectId],
    //   ref: "file",
    //   required: true,
    // },
    text: {
      type: String,
    },
    tagedUsers: {
      type: [mongoose.Types.ObjectId],
      ref: "users",
    },
    hashtags: {
      type: [String],
    },
    loc: {
      type: { type: String },
      coordinates: [Number],
    },
    media_count: {
      type: Number,
      required: true,
    },
    likes_count: {
      type: Number,
      default: 0,
    },
    is_reported_spam: {
      type: Boolean,
      default: false,
    },
    is_comment_enabled: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ loc: "2dsphere" });
PostSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  // this.media_count = this.media.length;
  next();
});

export default mongoose.model("Post", PostSchema);
