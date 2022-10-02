import mongoose from "mongoose";

var inviteSchema = new mongoose.Schema(
    {
        email: {
            type: String
        },
        userId: {
            type: String
        }
    },
    { timestamps: true }
);
export default mongoose.model("invites", inviteSchema);