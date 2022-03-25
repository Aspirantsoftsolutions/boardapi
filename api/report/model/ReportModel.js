import mongoose from "mongoose";

export const supportedReportTypes = ["user", "post", "comment"];

var ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
    },
    reportCollection: { type: String, enum: supportedReportTypes },
    post: {
      type: mongoose.Types.ObjectId,
      ref: "post",
    },
    comment: {
      type: mongoose.Types.ObjectId,
      ref: "post",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    text: String,
  },
  {
    timestamps: true,
  }
);

ReportSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  // this.media_count = this.media.length;
  next();
});

export default mongoose.model("report", ReportSchema);
