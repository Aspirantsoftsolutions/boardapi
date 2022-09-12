import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
    service: { type: String },
    token: { type: String },
    status: {
        type: String,
        enum: ['binded', 'unbinded'],
        default: 'unbinded',
        required: true,
    }
});

var cloudIntegrationSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: false,
        },
        school_Id: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        },
        integrations: [integrationSchema]
    },
    { timestamps: true }
);


export default mongoose.model("cloudIntegrations", cloudIntegrationSchema);