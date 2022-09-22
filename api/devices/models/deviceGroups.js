import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

var deviceGroupsModel = new mongoose.Schema(
    {
        groupName: { type: String, required: true },
        group_id: { type: String, default: uuidv4 },
        school_id: { type: String, required: true },
        devicesList: {
            type: [String],
            ref: 'devices'
        }
    },
    {
        timestamps: true,
    }
);

deviceGroupsModel.pre("save", function (next) {
    this.updatedAt = new Date();
    // this.media_count = this.media.length;
    next();
});

export default mongoose.model("deviceGroups", deviceGroupsModel);
