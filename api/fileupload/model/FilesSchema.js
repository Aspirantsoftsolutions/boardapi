import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const FilesSchema = new mongoose.Schema({
  
  userId: {
    type: String,
    required: true,
    default: uuidv4,
    unique: true
  },
  fileNames: [String]
});

export default mongoose.model("files", FilesSchema);
