import mongoose from "mongoose";

var devicesModel = new mongoose.Schema(
    {
        deviceid: { type: String, required: true },
        ip: { type: String, required: true },
        school_id: { type: String }
    },
    {
        timestamps: true,
    }
);

devicesModel.pre("save", function (next) {
    this.updatedAt = new Date();
    // this.media_count = this.media.length;
    next();
});

export default mongoose.model("devices", devicesModel);
