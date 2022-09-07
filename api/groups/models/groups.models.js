import mongoose from "mongoose";

var groupsModel = new mongoose.Schema(
    {
        name: { type: String, required: true },
        school_id: { type: String, required: true },
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }]
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("groups", groupsModel);
