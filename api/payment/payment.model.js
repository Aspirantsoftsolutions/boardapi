import mongoose from "mongoose";

var paymentSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        },
        paymentType: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        comments: {
            type: String
        },
        paymentDate: {
            type: String
        }
    },
    { timestamps: true }
);
export default mongoose.model("payments", paymentSchema);