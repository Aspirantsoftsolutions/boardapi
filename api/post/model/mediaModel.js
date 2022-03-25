import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const MediaSchema = mongoose.Schema(
  {
    mediaid: {
      type: String,
      required: true,
      default: uuidv4(),
      unique: true,
    },
    postid: {
      type: String,
      ref: "post",
      required: true,
    },
    media_name: {
      type: String,
      required: true,
    },
    media_path: {
      type: String,
      required: true,
    },
    media_type: {
      type: String,
      required: true,
    },
    media_size: {
      type: String,
      required: true,
    },
    height: {
      type: String,
      required: true,
    },
    width: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Media", MediaSchema);
