import mongoose from "mongoose";

var PlansSchema = new mongoose.Schema(
    {
        availableFeatures: {
            type: [String],
            required: true,
        },
        plans: {
            basic: {
                type: [String],
                required: true
            },
            premium: {
                type: [String],
                required: true
            },
            enterprise: {
                type: [String],
                required: true
            }
        }
    },
    { timestamps: true }
);
export default mongoose.model("plans", PlansSchema);