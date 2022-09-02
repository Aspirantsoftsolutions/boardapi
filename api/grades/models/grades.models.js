import mongoose from "mongoose";

var gradesModel = new mongoose.Schema(
    {
        name: { type: String, required: true },
        school_id: { type: String, required: true },
        students: { type: Array }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("grades", gradesModel);
