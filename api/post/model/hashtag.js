import mongoose from "mongoose";

const HastagSchema = new mongoose.Schema({
  hashtags: [String],
});

export default mongoose.model("hashtags", HastagSchema);
